package com.bionote.laboratory.service;

import com.bionote.common.api.PageResponse;
import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.laboratory.dto.LaboratoryJoinApplicationResponse;
import com.bionote.laboratory.dto.RegistrationJoinApplicationResponse;
import com.bionote.laboratory.dto.ReviewLaboratoryJoinApplicationRequest;
import com.bionote.laboratory.entity.JoinApplicationOrigin;
import com.bionote.laboratory.entity.JoinApplicationStatus;
import com.bionote.laboratory.entity.JoinReviewDecision;
import com.bionote.laboratory.entity.LaboratoryInvite;
import com.bionote.laboratory.entity.LaboratoryJoinApplication;
import com.bionote.laboratory.entity.LaboratoryMember;
import com.bionote.laboratory.entity.LaboratoryMemberStatus;
import com.bionote.laboratory.entity.LaboratoryRole;
import com.bionote.laboratory.entity.LaboratoryStatus;
import com.bionote.laboratory.repository.LaboratoryInviteRepository;
import com.bionote.laboratory.repository.LaboratoryJoinApplicationRepository;
import com.bionote.laboratory.repository.LaboratoryMemberRepository;
import com.bionote.user.entity.User;
import com.bionote.user.entity.UserStatus;
import com.bionote.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class LaboratoryJoinApplicationService {
    private final LaboratoryInviteRepository inviteRepository;
    private final LaboratoryJoinApplicationRepository applicationRepository;
    private final LaboratoryMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final InviteCodeHasher inviteCodeHasher;
    private final LaboratoryAccessService accessService;

    public LaboratoryJoinApplicationService(
            LaboratoryInviteRepository inviteRepository,
            LaboratoryJoinApplicationRepository applicationRepository,
            LaboratoryMemberRepository memberRepository,
            UserRepository userRepository,
            InviteCodeHasher inviteCodeHasher,
            LaboratoryAccessService accessService
    ) {
        this.inviteRepository = inviteRepository;
        this.applicationRepository = applicationRepository;
        this.memberRepository = memberRepository;
        this.userRepository = userRepository;
        this.inviteCodeHasher = inviteCodeHasher;
        this.accessService = accessService;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public RegistrationJoinApplicationResponse createForRegistration(
            String userId,
            String inviteCode,
            String message
    ) {
        LaboratoryJoinApplication application = createApplication(
                userId, inviteCode, message, JoinApplicationOrigin.REGISTRATION);
        return RegistrationJoinApplicationResponse.from(application);
    }

    @Transactional
    public LaboratoryJoinApplicationResponse createLater(
            String userId,
            String inviteCode,
            String message
    ) {
        return LaboratoryJoinApplicationResponse.from(createApplication(
                userId, inviteCode, normalizeOptional(message), JoinApplicationOrigin.LATER_JOIN));
    }

    @Transactional(readOnly = true)
    public PageResponse<LaboratoryJoinApplicationResponse> mine(
            String userId,
            int page,
            int size
    ) {
        return PageResponse.from(
                applicationRepository.findAllByApplicant_IdOrderByCreatedAtDesc(
                        userId, PageRequest.of(page, size)),
                LaboratoryJoinApplicationResponse::from
        );
    }

    @Transactional
    public void cancel(String applicationId, String userId) {
        LaboratoryJoinApplication application = applicationRepository
                .findByIdAndApplicant_Id(applicationId, userId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "实验室加入申请不存在"));
        requirePending(application);
        application.cancel();
    }

    @Transactional(readOnly = true)
    public PageResponse<LaboratoryJoinApplicationResponse> listForReview(
            String laboratoryId,
            String reviewerId,
            JoinApplicationStatus status,
            int page,
            int size
    ) {
        accessService.requireAnyRole(
                laboratoryId,
                reviewerId,
                LaboratoryRole.LAB_ADMIN,
                LaboratoryRole.MENTOR
        );
        return PageResponse.from(
                applicationRepository.findAllByLaboratory_IdAndStatusOrderByCreatedAtAsc(
                        laboratoryId, status, PageRequest.of(page, size)),
                LaboratoryJoinApplicationResponse::from
        );
    }

    @Transactional
    public LaboratoryJoinApplicationResponse review(
            String laboratoryId,
            String applicationId,
            String reviewerId,
            ReviewLaboratoryJoinApplicationRequest request
    ) {
        accessService.requireAnyRole(
                laboratoryId,
                reviewerId,
                LaboratoryRole.LAB_ADMIN,
                LaboratoryRole.MENTOR
        );
        LaboratoryJoinApplication application = applicationRepository
                .findByIdAndLaboratoryIdForUpdate(applicationId, laboratoryId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "实验室加入申请不存在"));
        requirePending(application);
        if (application.getVersion() != request.version()) {
            throw new BusinessException(
                    ErrorCode.LAB_VERSION_CONFLICT, "加入申请已被其他审核人处理");
        }

        User reviewer = requireActiveUser(reviewerId);
        String reason = normalizeOptional(request.reason());
        Instant now = Instant.now();

        if (request.decision() == JoinReviewDecision.REJECT) {
            if (reason == null) {
                throw new BusinessException(
                        ErrorCode.VALIDATION_ERROR, "拒绝申请时必须填写审核意见");
            }
            application.reject(reviewer, reason, now);
        } else {
            approveMembership(application, now);
            application.approve(reviewer, now);
        }
        return LaboratoryJoinApplicationResponse.from(
                applicationRepository.saveAndFlush(application));
    }

    private LaboratoryJoinApplication createApplication(
            String userId,
            String inviteCode,
            String message,
            JoinApplicationOrigin origin
    ) {
        User applicant = lockActiveUser(userId);
        String codeHash = inviteCodeHasher.hash(inviteCode.trim());
        LaboratoryInvite invite = inviteRepository.findByCodeHashForUpdate(codeHash)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.LAB_INVITE_INVALID, "实验室邀请码无效"));
        if (invite.getLaboratory().getStatus() != LaboratoryStatus.ACTIVE
                || !invite.isAvailableAt(Instant.now())) {
            throw new BusinessException(
                    ErrorCode.LAB_INVITE_UNAVAILABLE, "实验室邀请码已失效或使用次数已满");
        }

        String laboratoryId = invite.getLaboratory().getId();
        if (memberRepository.existsByUser_IdAndMemberStatus(
                userId, LaboratoryMemberStatus.ACTIVE)) {
            throw new BusinessException(
                    ErrorCode.LAB_ALREADY_MEMBER,
                    "用户已加入一个实验室，不能再次申请加入其他实验室"
            );
        }
        if (applicationRepository.existsByLaboratory_IdAndApplicant_IdAndStatus(
                laboratoryId, userId, JoinApplicationStatus.PENDING)) {
            throw new BusinessException(
                    ErrorCode.LAB_APPLICATION_ALREADY_PENDING, "已存在待审核的实验室加入申请");
        }

        invite.consume();
        return applicationRepository.saveAndFlush(new LaboratoryJoinApplication(
                invite.getLaboratory(),
                applicant,
                invite,
                normalizeOptional(message),
                origin
        ));
    }

    private void approveMembership(LaboratoryJoinApplication application, Instant now) {
        User applicant = userRepository.findByIdForUpdate(application.getApplicant().getId())
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "申请人不存在或已停用"));
        if (memberRepository.existsByUser_IdAndMemberStatus(
                applicant.getId(), LaboratoryMemberStatus.ACTIVE)) {
            throw new BusinessException(
                    ErrorCode.LAB_ALREADY_MEMBER,
                    "申请人已加入一个实验室，不能再次加入其他实验室"
            );
        }

        LaboratoryMember member = memberRepository.findByLaboratory_IdAndUser_Id(
                        application.getLaboratory().getId(),
                        applicant.getId())
                .orElse(null);
        if (member == null) {
            memberRepository.save(new LaboratoryMember(
                    application.getLaboratory(),
                    applicant,
                    LaboratoryRole.MEMBER,
                    application,
                    now
            ));
        } else if (member.getMemberStatus() != LaboratoryMemberStatus.ACTIVE) {
            member.reactivate(LaboratoryRole.MEMBER, application, now);
        }
    }

    private void requirePending(LaboratoryJoinApplication application) {
        if (!application.isPending()) {
            throw new BusinessException(
                    ErrorCode.LAB_APPLICATION_NOT_PENDING, "申请当前状态不能执行该操作");
        }
    }

    private User requireActiveUser(String userId) {
        return userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTH_UNAUTHORIZED, "当前用户不存在或已停用"));
    }

    private User lockActiveUser(String userId) {
        return userRepository.findByIdForUpdate(userId)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTH_UNAUTHORIZED, "当前用户不存在或已停用"));
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

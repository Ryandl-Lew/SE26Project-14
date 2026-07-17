package com.bionote.laboratory.service;

import com.bionote.common.api.PageResponse;
import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.laboratory.dto.LaboratoryMemberResponse;
import com.bionote.laboratory.dto.UpdateLaboratoryMemberRequest;
import com.bionote.laboratory.entity.Laboratory;
import com.bionote.laboratory.entity.LaboratoryMember;
import com.bionote.laboratory.entity.LaboratoryMemberStatus;
import com.bionote.laboratory.entity.LaboratoryRole;
import com.bionote.laboratory.repository.LaboratoryMemberRepository;
import com.bionote.user.entity.UserStatus;
import com.bionote.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class LaboratoryMemberService {
    private final LaboratoryMemberRepository memberRepository;
    private final LaboratoryAccessService accessService;
    private final UserRepository userRepository;

    public LaboratoryMemberService(
            LaboratoryMemberRepository memberRepository,
            LaboratoryAccessService accessService,
            UserRepository userRepository
    ) {
        this.memberRepository = memberRepository;
        this.accessService = accessService;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<LaboratoryMemberResponse> list(
            String laboratoryId,
            String actorId,
            int page,
            int size
    ) {
        accessService.requireActiveMember(laboratoryId, actorId);
        return PageResponse.from(
                memberRepository.findAllByLaboratory_Id(
                        laboratoryId, PageRequest.of(page, size)),
                LaboratoryMemberResponse::from
        );
    }

    @Transactional
    public LaboratoryMemberResponse update(
            String laboratoryId,
            String userId,
            String actorId,
            UpdateLaboratoryMemberRequest request
    ) {
        accessService.requireAnyRole(laboratoryId, actorId, LaboratoryRole.LAB_ADMIN);
        LaboratoryMember member = requireMember(laboratoryId, userId);
        validateVersion(member, request.version());
        if (member.getMemberStatus() != LaboratoryMemberStatus.ACTIVE
                && request.memberStatus() == LaboratoryMemberStatus.ACTIVE) {
            lockActiveUser(userId);
            requireNoActiveMembership(userId);
        }
        Laboratory laboratory = member.getLaboratory();
        preventLeaderMutation(laboratory, member, request.role(), request.memberStatus());
        preventFinalAdminRemoval(laboratoryId, member, request.role(), request.memberStatus());
        member.update(request.role(), request.memberStatus(), Instant.now());
        return LaboratoryMemberResponse.from(memberRepository.saveAndFlush(member));
    }

    @Transactional
    public void remove(String laboratoryId, String userId, String actorId) {
        accessService.requireAnyRole(laboratoryId, actorId, LaboratoryRole.LAB_ADMIN);
        LaboratoryMember member = requireMember(laboratoryId, userId);
        Laboratory laboratory = member.getLaboratory();
        if (laboratory.getLeader() != null
                && laboratory.getLeader().getId().equals(userId)) {
            throw new BusinessException(
                    ErrorCode.LAB_FINAL_ADMIN_REQUIRED, "请先转移实验室负责人再移除该成员");
        }
        preventFinalAdminRemoval(
                laboratoryId,
                member,
                member.getRole(),
                LaboratoryMemberStatus.REMOVED
        );
        member.remove(Instant.now());
    }

    private LaboratoryMember requireMember(String laboratoryId, String userId) {
        return memberRepository.findByLaboratory_IdAndUser_Id(laboratoryId, userId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.LAB_MEMBER_NOT_FOUND, "实验室成员不存在"));
    }

    private void validateVersion(LaboratoryMember member, long version) {
        if (member.getVersion() != version) {
            throw new BusinessException(
                    ErrorCode.LAB_VERSION_CONFLICT, "成员信息已被其他人修改，请刷新后重试");
        }
    }

    private void lockActiveUser(String userId) {
        userRepository.findByIdForUpdate(userId)
                .filter(user -> user.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "实验室成员不存在或已停用"));
    }

    private void requireNoActiveMembership(String userId) {
        if (memberRepository.existsByUser_IdAndMemberStatus(
                userId, LaboratoryMemberStatus.ACTIVE)) {
            throw new BusinessException(
                    ErrorCode.LAB_ALREADY_MEMBER,
                    "用户已加入一个实验室，不能在其他实验室中重新激活"
            );
        }
    }

    private void preventLeaderMutation(
            Laboratory laboratory,
            LaboratoryMember member,
            LaboratoryRole newRole,
            LaboratoryMemberStatus newStatus
    ) {
        if (laboratory.getLeader() != null
                && laboratory.getLeader().getId().equals(member.getUser().getId())
                && (newRole != LaboratoryRole.LAB_ADMIN
                || newStatus != LaboratoryMemberStatus.ACTIVE)) {
            throw new BusinessException(
                    ErrorCode.LAB_FINAL_ADMIN_REQUIRED, "实验室负责人必须保持有效管理员角色");
        }
    }

    private void preventFinalAdminRemoval(
            String laboratoryId,
            LaboratoryMember member,
            LaboratoryRole newRole,
            LaboratoryMemberStatus newStatus
    ) {
        boolean removingActiveAdmin = member.getRole() == LaboratoryRole.LAB_ADMIN
                && member.getMemberStatus() == LaboratoryMemberStatus.ACTIVE
                && (newRole != LaboratoryRole.LAB_ADMIN
                || newStatus != LaboratoryMemberStatus.ACTIVE);
        if (removingActiveAdmin
                && memberRepository.countByLaboratory_IdAndRoleAndMemberStatus(
                laboratoryId,
                LaboratoryRole.LAB_ADMIN,
                LaboratoryMemberStatus.ACTIVE) <= 1) {
            throw new BusinessException(
                    ErrorCode.LAB_FINAL_ADMIN_REQUIRED, "实验室至少需要一名有效管理员");
        }
    }
}

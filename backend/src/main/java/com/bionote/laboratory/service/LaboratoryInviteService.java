package com.bionote.laboratory.service;

import com.bionote.common.api.PageResponse;
import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.laboratory.dto.CreateLaboratoryInviteRequest;
import com.bionote.laboratory.dto.CreatedLaboratoryInviteResponse;
import com.bionote.laboratory.dto.LaboratoryInviteResponse;
import com.bionote.laboratory.entity.Laboratory;
import com.bionote.laboratory.entity.LaboratoryInvite;
import com.bionote.laboratory.entity.LaboratoryRole;
import com.bionote.laboratory.repository.LaboratoryInviteRepository;
import com.bionote.user.entity.User;
import com.bionote.user.entity.UserStatus;
import com.bionote.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class LaboratoryInviteService {
    private final LaboratoryInviteRepository inviteRepository;
    private final UserRepository userRepository;
    private final LaboratoryAccessService accessService;
    private final InviteCodeHasher inviteCodeHasher;
    private final SecureRandom secureRandom = new SecureRandom();

    public LaboratoryInviteService(
            LaboratoryInviteRepository inviteRepository,
            UserRepository userRepository,
            LaboratoryAccessService accessService,
            InviteCodeHasher inviteCodeHasher
    ) {
        this.inviteRepository = inviteRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
        this.inviteCodeHasher = inviteCodeHasher;
    }

    @Transactional
    public CreatedLaboratoryInviteResponse create(
            String laboratoryId,
            String actorId,
            CreateLaboratoryInviteRequest request
    ) {
        accessService.requireAnyRole(laboratoryId, actorId, LaboratoryRole.LAB_ADMIN);
        Laboratory laboratory = accessService.requireActiveLaboratory(laboratoryId);
        User actor = requireActiveUser(actorId);

        if (request.expiresAt() != null && !request.expiresAt().isAfter(Instant.now())) {
            throw new BusinessException(
                    ErrorCode.VALIDATION_ERROR, "邀请码过期时间必须晚于当前时间");
        }

        String plaintextCode = generateInviteCode();
        String codeHint = plaintextCode.substring(plaintextCode.length() - 6);
        LaboratoryInvite invite = inviteRepository.saveAndFlush(new LaboratoryInvite(
                laboratory,
                inviteCodeHasher.hash(plaintextCode),
                codeHint,
                request.expiresAt(),
                request.maxUses(),
                actor
        ));
        return new CreatedLaboratoryInviteResponse(
                plaintextCode,
                LaboratoryInviteResponse.from(invite)
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<LaboratoryInviteResponse> list(
            String laboratoryId,
            String actorId,
            int page,
            int size
    ) {
        accessService.requireAnyRole(
                laboratoryId,
                actorId,
                LaboratoryRole.LAB_ADMIN,
                LaboratoryRole.MENTOR
        );
        return PageResponse.from(
                inviteRepository.findAllByLaboratory_IdOrderByCreatedAtDesc(
                        laboratoryId, PageRequest.of(page, size)),
                LaboratoryInviteResponse::from
        );
    }

    @Transactional
    public void revoke(String laboratoryId, String inviteId, String actorId) {
        accessService.requireAnyRole(laboratoryId, actorId, LaboratoryRole.LAB_ADMIN);
        LaboratoryInvite invite = inviteRepository.findByIdAndLaboratory_Id(inviteId, laboratoryId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "实验室邀请码不存在"));
        invite.revoke(Instant.now());
    }

    private User requireActiveUser(String userId) {
        return userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.AUTH_UNAUTHORIZED, "当前用户不存在或已停用"));
    }

    private String generateInviteCode() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

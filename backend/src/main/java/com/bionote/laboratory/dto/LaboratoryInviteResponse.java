package com.bionote.laboratory.dto;

import com.bionote.laboratory.entity.LaboratoryInvite;
import com.bionote.laboratory.entity.LaboratoryInviteStatus;

import java.time.Instant;

public record LaboratoryInviteResponse(
        String id,
        String codeHint,
        LaboratoryInviteStatus status,
        Instant expiresAt,
        Integer maxUses,
        int usedCount,
        UserSummaryResponse createdBy,
        Instant createdAt,
        Instant revokedAt,
        long version
) {
    public static LaboratoryInviteResponse from(LaboratoryInvite invite) {
        return new LaboratoryInviteResponse(
                invite.getId(),
                invite.getCodeHint(),
                invite.getStatus(),
                invite.getExpiresAt(),
                invite.getMaxUses(),
                invite.getUsedCount(),
                UserSummaryResponse.from(invite.getCreatedBy()),
                invite.getCreatedAt(),
                invite.getRevokedAt(),
                invite.getVersion()
        );
    }
}

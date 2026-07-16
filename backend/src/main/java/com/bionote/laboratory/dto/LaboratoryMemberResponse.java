package com.bionote.laboratory.dto;

import com.bionote.laboratory.entity.LaboratoryMember;
import com.bionote.laboratory.entity.LaboratoryMemberStatus;
import com.bionote.laboratory.entity.LaboratoryRole;

import java.time.Instant;

public record LaboratoryMemberResponse(
        String id,
        LaboratorySummaryResponse laboratory,
        UserSummaryResponse user,
        LaboratoryRole role,
        LaboratoryMemberStatus memberStatus,
        Instant joinedAt,
        long version
) {
    public static LaboratoryMemberResponse from(LaboratoryMember member) {
        return new LaboratoryMemberResponse(
                member.getId(),
                LaboratorySummaryResponse.from(member.getLaboratory()),
                UserSummaryResponse.from(member.getUser()),
                member.getRole(),
                member.getMemberStatus(),
                member.getJoinedAt(),
                member.getVersion()
        );
    }
}

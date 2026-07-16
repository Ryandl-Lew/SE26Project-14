package com.bionote.laboratory.dto;

import com.bionote.laboratory.entity.JoinApplicationOrigin;
import com.bionote.laboratory.entity.JoinApplicationStatus;
import com.bionote.laboratory.entity.LaboratoryJoinApplication;

import java.time.Instant;

public record LaboratoryJoinApplicationResponse(
        String id,
        LaboratorySummaryResponse laboratory,
        UserSummaryResponse applicant,
        JoinApplicationOrigin origin,
        String requestMessage,
        JoinApplicationStatus status,
        UserSummaryResponse reviewer,
        Instant reviewedAt,
        String reviewReason,
        Instant createdAt,
        long version
) {
    public static LaboratoryJoinApplicationResponse from(LaboratoryJoinApplication application) {
        return new LaboratoryJoinApplicationResponse(
                application.getId(),
                LaboratorySummaryResponse.from(application.getLaboratory()),
                UserSummaryResponse.from(application.getApplicant()),
                application.getOrigin(),
                application.getRequestMessage(),
                application.getStatus(),
                application.getReviewedBy() == null
                        ? null
                        : UserSummaryResponse.from(application.getReviewedBy()),
                application.getReviewedAt(),
                application.getReviewReason(),
                application.getCreatedAt(),
                application.getVersion()
        );
    }
}

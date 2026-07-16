package com.bionote.laboratory.dto;

import com.bionote.laboratory.entity.JoinApplicationStatus;
import com.bionote.laboratory.entity.LaboratoryJoinApplication;

import java.time.Instant;

public record RegistrationJoinApplicationResponse(
        String id,
        LaboratorySummaryResponse laboratory,
        JoinApplicationStatus status,
        Instant createdAt,
        long version
) {
    public static RegistrationJoinApplicationResponse from(LaboratoryJoinApplication application) {
        return new RegistrationJoinApplicationResponse(
                application.getId(),
                LaboratorySummaryResponse.from(application.getLaboratory()),
                application.getStatus(),
                application.getCreatedAt(),
                application.getVersion()
        );
    }
}

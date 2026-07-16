package com.bionote.laboratory.dto;

import com.bionote.laboratory.entity.Laboratory;
import com.bionote.laboratory.entity.LaboratoryStatus;

import java.time.Instant;

public record LaboratoryResponse(
        String id,
        String code,
        String name,
        String description,
        LaboratoryStatus status,
        UserSummaryResponse leader,
        UserSummaryResponse createdBy,
        Instant createdAt,
        Instant updatedAt,
        long version
) {
    public static LaboratoryResponse from(Laboratory laboratory) {
        return new LaboratoryResponse(
                laboratory.getId(),
                laboratory.getCode(),
                laboratory.getName(),
                laboratory.getDescription(),
                laboratory.getStatus(),
                laboratory.getLeader() == null
                        ? null
                        : UserSummaryResponse.from(laboratory.getLeader()),
                UserSummaryResponse.from(laboratory.getCreatedBy()),
                laboratory.getCreatedAt(),
                laboratory.getUpdatedAt(),
                laboratory.getVersion()
        );
    }
}

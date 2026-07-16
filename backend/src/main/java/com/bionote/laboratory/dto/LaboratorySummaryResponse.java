package com.bionote.laboratory.dto;

import com.bionote.laboratory.entity.Laboratory;
import com.bionote.laboratory.entity.LaboratoryStatus;

public record LaboratorySummaryResponse(
        String id,
        String code,
        String name,
        LaboratoryStatus status
) {
    public static LaboratorySummaryResponse from(Laboratory laboratory) {
        return new LaboratorySummaryResponse(
                laboratory.getId(),
                laboratory.getCode(),
                laboratory.getName(),
                laboratory.getStatus()
        );
    }
}

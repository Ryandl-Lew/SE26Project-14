package com.bionote.dashboard.dto;

import java.time.Instant;

public record SimpleRecordInfo(
        String id,
        String code,
        String title,
        String projectId,
        String projectName,
        String status,
        String ownerName,
        Instant updatedAt
) {
}

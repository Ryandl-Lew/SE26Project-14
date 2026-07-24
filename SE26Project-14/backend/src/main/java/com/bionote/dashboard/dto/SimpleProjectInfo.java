package com.bionote.dashboard.dto;

import java.time.Instant;

public record SimpleProjectInfo(
        String id,
        String code,
        String name,
        String status,
        String ownerName,
        Instant createdAt
) {
}

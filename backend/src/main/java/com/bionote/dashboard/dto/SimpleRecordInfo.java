package com.bionote.dashboard.dto;

import java.time.Instant;

public record SimpleRecordInfo(
        String id, String code, String title, String projectId, String projectName,
        String status, String ownerId, String ownerName, Instant updatedAt, String targetUrl
) {
}

package com.bionote.dashboard.dto;

import java.time.Instant;

public record PendingTaskInfo(
        String id, String type, String recordId, String recordTitle,
        String projectId, String projectName, String ownerId, String ownerName,
        Instant updatedAt, String targetUrl
) {
}

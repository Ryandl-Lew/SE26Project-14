package com.bionote.project.dto;

import com.bionote.project.entity.Activity;
import java.time.Instant;

public record ProjectActivityResponse(
        String id,
        String action,
        String targetType,
        String targetId,
        String summary,
        String actorName,
        Instant createdAt
) {
    public static ProjectActivityResponse from(Activity activity, String actorName) {
        return new ProjectActivityResponse(
                activity.getId(),
                activity.getAction(),
                activity.getTargetType(),
                activity.getTargetId(),
                activity.getSummary(),
                actorName,
                activity.getCreatedAt()
        );
    }
}

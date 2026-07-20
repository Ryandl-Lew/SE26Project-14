package com.bionote.collaboration.dto;

import com.bionote.project.entity.Activity;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Schema(description = "活动日志响应体")
public record ActivityResponse(
        @Schema(description = "活动 ID") String id,
        @Schema(description = "项目 ID") String projectId,
        @Schema(description = "操作人 ID") String actorId,
        @Schema(description = "操作类型") String action,
        @Schema(description = "目标类型") String targetType,
        @Schema(description = "目标 ID") String targetId,
        @Schema(description = "操作摘要") String summary,
        @Schema(description = "创建时间") OffsetDateTime createdAt
) {
    public static ActivityResponse from(Activity activity) {
        return new ActivityResponse(
                activity.getId(), activity.getProjectId(), activity.getActorId(),
                activity.getAction(), activity.getTargetType(), activity.getTargetId(),
                activity.getSummary(),
                activity.getCreatedAt() != null
                        ? activity.getCreatedAt().atOffset(ZoneOffset.ofHours(8))
                        : null
        );
    }
}

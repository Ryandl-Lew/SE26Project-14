package com.bionote.collaboration.dto;

import com.bionote.collaboration.entity.Review;
import com.bionote.collaboration.entity.ReviewDecision;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Schema(description = "审核记录响应体")
public record ReviewResponse(
        @Schema(description = "审核 ID") String id,
        @Schema(description = "记录 ID") String recordId,
        @Schema(description = "审核人 ID") String reviewerId,
        @Schema(description = "审核决定") ReviewDecision decision,
        @Schema(description = "审核原因") String reason,
        @Schema(description = "创建时间") OffsetDateTime createdAt
) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(), review.getRecordId(), review.getReviewerId(),
                review.getDecision(), review.getReason(),
                review.getCreatedAt() != null
                        ? review.getCreatedAt().atOffset(ZoneOffset.ofHours(8))
                        : null
        );
    }
}
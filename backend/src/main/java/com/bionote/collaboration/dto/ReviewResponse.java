package com.bionote.collaboration.dto;

import com.bionote.collaboration.entity.Review;

import java.time.Instant;

public record ReviewResponse(
        String id,
        String recordId,
        String reviewerId,
        String reviewerName,
        String decision,
        String reason,
        Instant createdAt
) {
    public static ReviewResponse from(Review review, String reviewerName) {
        return new ReviewResponse(
                review.getId(),
                review.getRecordId(),
                review.getReviewerId(),
                reviewerName,
                review.getDecision(),
                review.getReason(),
                review.getCreatedAt()
        );
    }
}

package com.bionote.collaboration.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "reviews")
public class Review extends BaseEntity {

    @Column(name = "record_id", nullable = false, length = 36)
    private String recordId;

    @Column(name = "reviewer_id", nullable = false, length = 36)
    private String reviewerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ReviewDecision decision;

    @Column(nullable = false, length = 1000)
    private String reason;

    protected Review() {
    }

    public Review(String recordId, String reviewerId, ReviewDecision decision, String reason) {
        this.recordId = recordId;
        this.reviewerId = reviewerId;
        this.decision = decision;
        this.reason = reason;
    }

    public String getRecordId() {
        return recordId;
    }

    public String getReviewerId() {
        return reviewerId;
    }

    public ReviewDecision getDecision() {
        return decision;
    }

    public String getReason() {
        return reason;
    }
}

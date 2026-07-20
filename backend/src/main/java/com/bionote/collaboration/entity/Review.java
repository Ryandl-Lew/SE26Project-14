package com.bionote.collaboration.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "reviews")
@EntityListeners(AuditingEntityListener.class)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    private String id;

    @Column(name = "record_id", nullable = false, length = 36)
    private String recordId;

    @Column(name = "reviewer_id", nullable = false, length = 36)
    private String reviewerId;

    @Column(name = "decision", nullable = false, length = 32)
    private String decision;

    @Column(name = "reason", nullable = false, length = 1000)
    private String reason;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Review() {
    }

    public Review(String recordId, String reviewerId, String decision, String reason) {
        this.recordId = recordId;
        this.reviewerId = reviewerId;
        this.decision = decision;
        this.reason = reason;
    }

    public String getId() {
        return id;
    }

    public String getRecordId() {
        return recordId;
    }

    public String getReviewerId() {
        return reviewerId;
    }

    public String getDecision() {
        return decision;
    }

    public String getReason() {
        return reason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

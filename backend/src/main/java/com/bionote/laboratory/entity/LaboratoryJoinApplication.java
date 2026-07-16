package com.bionote.laboratory.entity;

import com.bionote.common.persistence.BaseEntity;
import com.bionote.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "laboratory_join_applications")
public class LaboratoryJoinApplication extends BaseEntity {
    private static final String PENDING_MARKER = "P";

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "laboratory_id", nullable = false)
    private Laboratory laboratory;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User applicant;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invite_id", nullable = false)
    private LaboratoryInvite invite;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private JoinApplicationOrigin origin;

    @Column(name = "request_message", length = 500)
    private String requestMessage;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private JoinApplicationStatus status;

    @Column(name = "pending_marker", length = 1)
    @JdbcTypeCode(SqlTypes.CHAR)
    private String pendingMarker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "review_reason", length = 1000)
    private String reviewReason;

    @Version
    @Column(nullable = false)
    private long version;

    protected LaboratoryJoinApplication() {
    }

    public LaboratoryJoinApplication(
            Laboratory laboratory,
            User applicant,
            LaboratoryInvite invite,
            String requestMessage,
            JoinApplicationOrigin origin
    ) {
        this.laboratory = laboratory;
        this.applicant = applicant;
        this.invite = invite;
        this.origin = origin;
        this.requestMessage = requestMessage;
        this.status = JoinApplicationStatus.PENDING;
        this.pendingMarker = PENDING_MARKER;
    }

    public void approve(User reviewer, Instant now) {
        status = JoinApplicationStatus.APPROVED;
        pendingMarker = null;
        reviewedBy = reviewer;
        reviewedAt = now;
        reviewReason = null;
    }

    public void reject(User reviewer, String reason, Instant now) {
        status = JoinApplicationStatus.REJECTED;
        pendingMarker = null;
        reviewedBy = reviewer;
        reviewedAt = now;
        reviewReason = reason;
    }

    public void cancel() {
        status = JoinApplicationStatus.CANCELLED;
        pendingMarker = null;
    }

    public boolean isPending() {
        return status == JoinApplicationStatus.PENDING;
    }

    public Laboratory getLaboratory() {
        return laboratory;
    }

    public User getApplicant() {
        return applicant;
    }

    public JoinApplicationOrigin getOrigin() {
        return origin;
    }

    public String getRequestMessage() {
        return requestMessage;
    }

    public JoinApplicationStatus getStatus() {
        return status;
    }

    public User getReviewedBy() {
        return reviewedBy;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public String getReviewReason() {
        return reviewReason;
    }

    public long getVersion() {
        return version;
    }
}

package com.bionote.record.entity;

import java.util.EnumSet;
import java.util.Set;

public enum RecordStatus {
    DRAFT,
    IN_PROGRESS,
    PENDING_REVIEW,
    COMPLETED,
    REJECTED,
    SUPPLEMENT,
    ARCHIVED;

    public boolean canEdit() {
        return this == DRAFT || this == IN_PROGRESS || this == SUPPLEMENT;
    }

    public boolean canSubmit() {
        return this == DRAFT || this == IN_PROGRESS || this == SUPPLEMENT;
    }

    public boolean canReview() {
        return this == PENDING_REVIEW;
    }

    public boolean canArchive() {
        return this == DRAFT || this == IN_PROGRESS || this == COMPLETED;
    }

    public boolean canStart() {
        return this == DRAFT;
    }

    public boolean canRejectToSupplement() {
        return this == REJECTED;
    }

    public Set<RecordStatus> allowedTransitions() {
        return switch (this) {
            case DRAFT -> EnumSet.of(DRAFT, IN_PROGRESS, PENDING_REVIEW, ARCHIVED);
            case IN_PROGRESS -> EnumSet.of(IN_PROGRESS, PENDING_REVIEW, ARCHIVED);
            case PENDING_REVIEW -> EnumSet.of(COMPLETED, REJECTED);
            case REJECTED -> EnumSet.of(SUPPLEMENT);
            case SUPPLEMENT -> EnumSet.of(SUPPLEMENT, PENDING_REVIEW);
            case COMPLETED -> EnumSet.of(COMPLETED, ARCHIVED);
            case ARCHIVED -> EnumSet.of(ARCHIVED);
        };
    }

    public boolean canTransitionTo(RecordStatus next) {
        return allowedTransitions().contains(next);
    }
}

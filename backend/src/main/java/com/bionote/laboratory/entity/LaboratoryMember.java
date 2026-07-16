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
@Table(name = "laboratory_members")
public class LaboratoryMember extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "laboratory_id", nullable = false)
    private Laboratory laboratory;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private LaboratoryRole role;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "member_status", nullable = false, length = 32)
    private LaboratoryMemberStatus memberStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_from_application_id")
    private LaboratoryJoinApplication approvedFromApplication;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected LaboratoryMember() {
    }

    public LaboratoryMember(
            Laboratory laboratory,
            User user,
            LaboratoryRole role,
            LaboratoryJoinApplication approvedFromApplication,
            Instant joinedAt
    ) {
        this.laboratory = laboratory;
        this.user = user;
        this.role = role;
        this.memberStatus = LaboratoryMemberStatus.ACTIVE;
        this.approvedFromApplication = approvedFromApplication;
        this.joinedAt = joinedAt;
    }

    public void reactivate(
            LaboratoryRole role,
            LaboratoryJoinApplication application,
            Instant now
    ) {
        this.role = role;
        this.memberStatus = LaboratoryMemberStatus.ACTIVE;
        this.approvedFromApplication = application;
        this.joinedAt = now;
        this.leftAt = null;
    }

    public void update(LaboratoryRole role, LaboratoryMemberStatus status, Instant now) {
        this.role = role;
        this.memberStatus = status;
        this.leftAt = status == LaboratoryMemberStatus.ACTIVE ? null : now;
    }

    public void remove(Instant now) {
        this.memberStatus = LaboratoryMemberStatus.REMOVED;
        this.leftAt = now;
    }

    public Laboratory getLaboratory() {
        return laboratory;
    }

    public User getUser() {
        return user;
    }

    public LaboratoryRole getRole() {
        return role;
    }

    public LaboratoryMemberStatus getMemberStatus() {
        return memberStatus;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public long getVersion() {
        return version;
    }
}

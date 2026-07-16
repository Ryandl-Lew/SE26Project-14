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
@Table(name = "laboratory_invites")
public class LaboratoryInvite extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "laboratory_id", nullable = false)
    private Laboratory laboratory;

    @Column(name = "code_hash", nullable = false, unique = true, length = 64)
    private String codeHash;

    @Column(name = "code_hint", length = 16)
    private String codeHint;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private LaboratoryInviteStatus status;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "max_uses")
    private Integer maxUses;

    @Column(name = "used_count", nullable = false)
    private int usedCount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Version
    @Column(nullable = false)
    private long version;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    protected LaboratoryInvite() {
    }

    public LaboratoryInvite(
            Laboratory laboratory,
            String codeHash,
            String codeHint,
            Instant expiresAt,
            Integer maxUses,
            User createdBy
    ) {
        this.laboratory = laboratory;
        this.codeHash = codeHash;
        this.codeHint = codeHint;
        this.status = LaboratoryInviteStatus.ACTIVE;
        this.expiresAt = expiresAt;
        this.maxUses = maxUses;
        this.createdBy = createdBy;
    }

    public boolean isAvailableAt(Instant now) {
        return status == LaboratoryInviteStatus.ACTIVE
                && (expiresAt == null || expiresAt.isAfter(now))
                && (maxUses == null || usedCount < maxUses);
    }

    public void consume() {
        usedCount++;
    }

    public void revoke(Instant now) {
        this.status = LaboratoryInviteStatus.REVOKED;
        this.revokedAt = now;
    }

    public Laboratory getLaboratory() {
        return laboratory;
    }

    public String getCodeHint() {
        return codeHint;
    }

    public LaboratoryInviteStatus getStatus() {
        return status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Integer getMaxUses() {
        return maxUses;
    }

    public int getUsedCount() {
        return usedCount;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public long getVersion() {
        return version;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }
}

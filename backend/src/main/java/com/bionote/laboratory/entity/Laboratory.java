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
@Table(name = "laboratories")
public class Laboratory extends BaseEntity {
    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private LaboratoryStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "leader_id")
    private User leader;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Version
    @Column(nullable = false)
    private long version;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Laboratory() {
    }

    public Laboratory(String code, String name, String description, User leader, User createdBy) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.status = LaboratoryStatus.ACTIVE;
        this.leader = leader;
        this.createdBy = createdBy;
    }

    public void changeLeader(User leader) {
        this.leader = leader;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public LaboratoryStatus getStatus() {
        return status;
    }

    public User getLeader() {
        return leader;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public long getVersion() {
        return version;
    }
}

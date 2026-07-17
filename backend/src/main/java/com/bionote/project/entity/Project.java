package com.bionote.project.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;

@Entity
@Table(name = "projects")
public class Project extends BaseEntity {

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ProjectStatus status;

    @Column(name = "owner_id", nullable = false, length = 36)
    private String ownerId;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Project() {
    }

    public Project(String code, String name, String description, String ownerId) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.ownerId = ownerId;
        this.status = ProjectStatus.ACTIVE;
        this.version = 0L;
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

    public ProjectStatus getStatus() {
        return status;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public Long getVersion() {
        return version;
    }

    public Instant getArchivedAt() {
        return archivedAt;
    }

    public void updateInfo(String name, String description) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }
        if (description != null) {
            this.description = description;
        }
    }

    public void archive() {
        this.status = ProjectStatus.ARCHIVED;
        this.archivedAt = Instant.now();
    }

    public boolean isActive() {
        return this.status == ProjectStatus.ACTIVE;
    }
}

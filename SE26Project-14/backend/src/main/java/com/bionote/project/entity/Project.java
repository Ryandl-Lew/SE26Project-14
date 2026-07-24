package com.bionote.project.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;

@Entity
@Table(name = "projects")
public class Project extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 32)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false, length = 32)
    private ProjectStatus status;

    @Column(name = "owner_id", nullable = false, length = 36)
    private String ownerId;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected Project() {
    }

    public Project(String code, String name, String description, ProjectStatus status, String ownerId) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.status = status;
        this.ownerId = ownerId;
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

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setStatus(ProjectStatus status) {
        this.status = status;
    }

    public void setArchivedAt(Instant archivedAt) {
        this.archivedAt = archivedAt;
    }
}

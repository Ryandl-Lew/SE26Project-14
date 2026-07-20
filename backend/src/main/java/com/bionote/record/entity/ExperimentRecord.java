package com.bionote.record.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "experiment_records")
@EntityListeners(AuditingEntityListener.class)
public class ExperimentRecord extends BaseEntity {

    @Column(nullable = false, unique = true, length = 32)
    private String code;

    @Column(name = "project_id", nullable = false, length = 36)
    private String projectId;

    @Column(name = "template_id", length = 36)
    private String templateId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "experiment_type", nullable = false, length = 100)
    private String experimentType;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 32)
    private RecordStatus status;

    @Column(name = "owner_id", nullable = false, length = 36)
    private String ownerId;

    @Column(name = "experiment_date", nullable = false)
    private LocalDate experimentDate;

    @Column(length = 255)
    private String location;

    @Column(name = "content_json", nullable = false, columnDefinition = "TEXT")
    private String contentJson;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected ExperimentRecord() {
    }

    public ExperimentRecord(String code, String projectId, String title,
                            String experimentType, String ownerId, LocalDate experimentDate) {
        this.code = code;
        this.projectId = projectId;
        this.title = title;
        this.experimentType = experimentType;
        this.ownerId = ownerId;
        this.experimentDate = experimentDate;
        this.status = RecordStatus.DRAFT;
        this.version = 0L;
    }

    public String getCode() {
        return code;
    }

    public String getProjectId() {
        return projectId;
    }

    public String getTemplateId() {
        return templateId;
    }

    public String getTitle() {
        return title;
    }

    public String getExperimentType() {
        return experimentType;
    }

    public RecordStatus getStatus() {
        return status;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public LocalDate getExperimentDate() {
        return experimentDate;
    }

    public String getLocation() {
        return location;
    }

    public String getContentJson() {
        return contentJson;
    }

    public Long getVersion() {
        return version;
    }

    public Instant getArchivedAt() {
        return archivedAt;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setExperimentType(String experimentType) {
        this.experimentType = experimentType;
    }

    public void setStatus(RecordStatus status) {
        this.status = status;
    }

    public void setExperimentDate(LocalDate experimentDate) {
        this.experimentDate = experimentDate;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setContentJson(String contentJson) {
        this.contentJson = contentJson;
    }

    public void setArchivedAt(Instant archivedAt) {
        this.archivedAt = archivedAt;
    }
}

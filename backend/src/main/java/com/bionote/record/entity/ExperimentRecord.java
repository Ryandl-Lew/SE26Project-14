package com.bionote.record.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "experiment_records")
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
    @Column(nullable = false, length = 32)
    private RecordStatus status;

    @Column(name = "owner_id", nullable = false, length = 36)
    private String ownerId;

    @Column(name = "experiment_date", nullable = false)
    private LocalDate experimentDate;

    @Column(length = 255)
    private String location;

    @Column(name = "content_json", nullable = false, length = 20000)
    private String contentJson;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "archived_at")
    private Instant archivedAt;

    protected ExperimentRecord() {
    }

    public ExperimentRecord(String code,
                            String projectId,
                            String templateId,
                            String title,
                            String experimentType,
                            String ownerId,
                            LocalDate experimentDate,
                            String location,
                            String contentJson) {
        this.code = code;
        this.projectId = projectId;
        this.templateId = templateId;
        this.title = title;
        this.experimentType = experimentType;
        this.ownerId = ownerId;
        this.experimentDate = experimentDate;
        this.location = location;
        this.contentJson = contentJson;
        this.status = RecordStatus.DRAFT;
        this.version = 1L;
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

    public void updateContent(String title,
                              String experimentType,
                              LocalDate experimentDate,
                              String location,
                              String contentJson) {
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        if (experimentType != null && !experimentType.isBlank()) {
            this.experimentType = experimentType;
        }
        if (experimentDate != null) {
            this.experimentDate = experimentDate;
        }
        if (location != null) {
            this.location = location;
        }
        if (contentJson != null) {
            this.contentJson = contentJson;
        }
    }

    public void changeStatus(RecordStatus next) {
        if (!this.status.canTransitionTo(next)) {
            throw new IllegalStateException(
                    String.format("状态转换非法: %s -> %s", this.status, next));
        }
        this.status = next;
    }

    public void archive() {
        changeStatus(RecordStatus.ARCHIVED);
        this.archivedAt = Instant.now();
    }

    public boolean isEditable() {
        return this.status.canEdit();
    }
}

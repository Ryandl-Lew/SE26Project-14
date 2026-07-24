package com.bionote.template.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "experiment_templates")
@EntityListeners(AuditingEntityListener.class)
public class ExperimentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 64)
    private String category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "built_in", nullable = false)
    private boolean builtIn;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "created_by", length = 36)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected ExperimentTemplate() {
    }

    public ExperimentTemplate(String name, String category, String description,
                              boolean builtIn, String createdBy) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.builtIn = builtIn;
        this.createdBy = createdBy;
        this.version = 0L;
    }

    public ExperimentTemplate(String id, String name, String category, String description,
                              boolean builtIn, Long version, String createdBy,
                              Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.description = description;
        this.builtIn = builtIn;
        this.version = version;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public boolean isBuiltIn() {
        return builtIn;
    }

    public Long getVersion() {
        return version;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setBuiltIn(boolean builtIn) {
        this.builtIn = builtIn;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}

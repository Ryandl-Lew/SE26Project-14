package com.bionote.template.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "experiment_templates")
public class ExperimentTemplate extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 64)
    private String category;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(name = "built_in", nullable = false)
    private Boolean builtIn;

    @Version
    @Column(nullable = false)
    private Long version;

    @Column(name = "created_by", length = 36)
    private String createdBy;

    protected ExperimentTemplate() {
    }

    public ExperimentTemplate(String name, String category, String description, boolean builtIn) {
        this.name = name;
        this.category = category;
        this.description = description;
        this.builtIn = builtIn;
        this.version = 0L;
    }

    public String getName() { return name; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public Boolean getBuiltIn() { return builtIn; }
    public Long getVersion() { return version; }
    public String getCreatedBy() { return createdBy; }
}
package com.bionote.collaboration.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "activities")
public class Activity extends BaseEntity {

    @Column(name = "project_id", nullable = false, length = 36)
    private String projectId;

    @Column(name = "actor_id", nullable = false, length = 36)
    private String actorId;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(name = "target_type", nullable = false, length = 64)
    private String targetType;

    @Column(name = "target_id", nullable = false, length = 36)
    private String targetId;

    @Column(nullable = false, length = 500)
    private String summary;

    protected Activity() {
    }

    public Activity(String projectId,
                    String actorId,
                    String action,
                    String targetType,
                    String targetId,
                    String summary) {
        this.projectId = projectId;
        this.actorId = actorId;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.summary = summary;
    }

    public String getProjectId() {
        return projectId;
    }

    public String getActorId() {
        return actorId;
    }

    public String getAction() {
        return action;
    }

    public String getTargetType() {
        return targetType;
    }

    public String getTargetId() {
        return targetId;
    }

    public String getSummary() {
        return summary;
    }
}

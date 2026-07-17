package com.bionote.project.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "project_members")
public class ProjectMember extends BaseEntity {

    @Column(name = "project_id", nullable = false, length = 36)
    private String projectId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ProjectRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_status", nullable = false, length = 32)
    private ProjectMemberStatus memberStatus;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    protected ProjectMember() {
    }

    public ProjectMember(String projectId, String userId, ProjectRole role) {
        this.projectId = projectId;
        this.userId = userId;
        this.role = role;
        this.memberStatus = ProjectMemberStatus.ACTIVE;
        this.joinedAt = Instant.now();
    }

    public String getProjectId() {
        return projectId;
    }

    public String getUserId() {
        return userId;
    }

    public ProjectRole getRole() {
        return role;
    }

    public ProjectMemberStatus getMemberStatus() {
        return memberStatus;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public Instant getLastActiveAt() {
        return lastActiveAt;
    }

    public void changeRole(ProjectRole role) {
        this.role = role;
    }

    public void activate() {
        this.memberStatus = ProjectMemberStatus.ACTIVE;
    }

    public void remove() {
        this.memberStatus = ProjectMemberStatus.REMOVED;
    }

    public boolean isActive() {
        return this.memberStatus == ProjectMemberStatus.ACTIVE;
    }
}

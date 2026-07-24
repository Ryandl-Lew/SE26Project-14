package com.bionote.project.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;

@Entity
@Table(name = "project_members")
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    private String id;

    @Column(name = "project_id", nullable = false, length = 36)
    private String projectId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "role", nullable = false, length = 32)
    private ProjectRole role;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "member_status", nullable = false, length = 32)
    private MemberStatus memberStatus;

    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    protected ProjectMember() {
    }

    public ProjectMember(String projectId, String userId, ProjectRole role, MemberStatus memberStatus) {
        this.projectId = projectId;
        this.userId = userId;
        this.role = role;
        this.memberStatus = memberStatus;
        this.joinedAt = Instant.now();
    }

    public String getId() {
        return id;
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

    public MemberStatus getMemberStatus() {
        return memberStatus;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public Instant getLastActiveAt() {
        return lastActiveAt;
    }

    public void setRole(ProjectRole role) {
        this.role = role;
    }

    public void setMemberStatus(MemberStatus memberStatus) {
        this.memberStatus = memberStatus;
    }

    public void setLastActiveAt(Instant lastActiveAt) {
        this.lastActiveAt = lastActiveAt;
    }
}

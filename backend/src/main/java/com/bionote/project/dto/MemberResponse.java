package com.bionote.project.dto;

import com.bionote.project.entity.ProjectMember;
import com.bionote.user.entity.User;
import java.time.Instant;

public record MemberResponse(
        String id,
        String projectId,
        String userId,
        String username,
        String name,
        String email,
        String role,
        String status,
        Instant joinedAt,
        Instant lastActiveAt
) {
    public static MemberResponse from(ProjectMember member, User user) {
        return new MemberResponse(
                member.getId(),
                member.getProjectId(),
                member.getUserId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                member.getRole().name(),
                member.getMemberStatus().name(),
                member.getJoinedAt(),
                member.getLastActiveAt()
        );
    }
}

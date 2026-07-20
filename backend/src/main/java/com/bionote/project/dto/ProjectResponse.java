package com.bionote.project.dto;

import com.bionote.project.entity.Project;
import java.time.Instant;

public record ProjectResponse(
        String id,
        String code,
        String name,
        String description,
        String status,
        String ownerId,
        String ownerName,
        Long version,
        Instant createdAt,
        Instant updatedAt,
        Instant archivedAt
) {
    public static ProjectResponse from(Project project, String ownerName) {
        return new ProjectResponse(
                project.getId(),
                project.getCode(),
                project.getName(),
                project.getDescription(),
                project.getStatus().name(),
                project.getOwnerId(),
                ownerName,
                project.getVersion(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                project.getArchivedAt()
        );
    }
}

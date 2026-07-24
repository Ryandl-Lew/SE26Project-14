package com.bionote.record.dto;

import com.bionote.record.entity.ExperimentRecord;

import java.time.Instant;
import java.time.LocalDate;

public record RecordResponse(
        String id,
        String code,
        String projectId,
        String templateId,
        String title,
        String experimentType,
        String status,
        String ownerId,
        String ownerName,
        LocalDate experimentDate,
        String location,
        String contentJson,
        Long version,
        Instant createdAt,
        Instant updatedAt,
        Instant archivedAt,
        String reviewerIds
) {
    public static RecordResponse from(ExperimentRecord record, String ownerName) {
        return new RecordResponse(
                record.getId(),
                record.getCode(),
                record.getProjectId(),
                record.getTemplateId(),
                record.getTitle(),
                record.getExperimentType(),
                record.getStatus().name(),
                record.getOwnerId(),
                ownerName,
                record.getExperimentDate(),
                record.getLocation(),
                record.getContentJson(),
                record.getVersion(),
                record.getCreatedAt(),
                record.getUpdatedAt(),
                record.getArchivedAt(),
                record.getReviewerIds()
        );
    }
}

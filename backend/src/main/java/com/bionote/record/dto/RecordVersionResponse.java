package com.bionote.record.dto;

import com.bionote.record.entity.RecordVersion;

import java.time.Instant;

public record RecordVersionResponse(
        String id,
        String recordId,
        Long versionNo,
        String changedBy,
        String changeReason,
        Instant createdAt
) {
    public static RecordVersionResponse from(RecordVersion version) {
        return new RecordVersionResponse(
                version.getId(),
                version.getRecordId(),
                version.getVersionNo(),
                version.getChangedBy(),
                version.getChangeReason(),
                version.getCreatedAt()
        );
    }
}

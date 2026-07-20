package com.bionote.record.dto;

import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Schema(description = "实验记录摘要")
public record RecordSummaryResponse(
        @Schema(description = "记录 ID") String id,
        @Schema(description = "记录编号") String code,
        @Schema(description = "标题") String title,
        @Schema(description = "实验类型") String experimentType,
        @Schema(description = "状态") RecordStatus status,
        @Schema(description = "负责人 ID") String ownerId,
        @Schema(description = "实验日期") LocalDate experimentDate,
        @Schema(description = "版本号") Long version,
        @Schema(description = "创建时间") OffsetDateTime createdAt,
        @Schema(description = "更新时间") OffsetDateTime updatedAt
) {
    public static RecordSummaryResponse from(ExperimentRecord r) {
        return new RecordSummaryResponse(
                r.getId(), r.getCode(), r.getTitle(), r.getExperimentType(),
                r.getStatus(), r.getOwnerId(), r.getExperimentDate(), r.getVersion(),
                toOffset(r.getCreatedAt()), toOffset(r.getUpdatedAt()));
    }

    private static OffsetDateTime toOffset(java.time.Instant instant) {
        return instant != null ? instant.atOffset(ZoneOffset.ofHours(8)) : null;
    }
}
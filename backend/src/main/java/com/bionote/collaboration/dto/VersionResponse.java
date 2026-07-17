package com.bionote.collaboration.dto;

import com.bionote.collaboration.entity.RecordVersion;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Schema(description = "版本历史响应体")
public record VersionResponse(
        @Schema(description = "版本 ID") String id,
        @Schema(description = "记录 ID") String recordId,
        @Schema(description = "版本号") Long versionNo,
        @Schema(description = "修改人 ID") String changedBy,
        @Schema(description = "修改原因") String changeReason,
        @Schema(description = "创建时间") OffsetDateTime createdAt
) {
    public static VersionResponse from(RecordVersion v) {
        return new VersionResponse(
                v.getId(), v.getRecordId(), v.getVersionNo(),
                v.getChangedBy(), v.getChangeReason(),
                v.getCreatedAt() != null
                        ? v.getCreatedAt().atOffset(ZoneOffset.ofHours(8))
                        : null
        );
    }
}
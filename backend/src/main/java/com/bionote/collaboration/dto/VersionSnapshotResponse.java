package com.bionote.collaboration.dto;

import com.bionote.collaboration.entity.RecordVersion;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Schema(description = "版本快照详情（含完整内容）")
public record VersionSnapshotResponse(
        @Schema(description = "版本号") Long versionNo,
        @Schema(description = "快照 JSON") String snapshotJson,
        @Schema(description = "修改人 ID") String changedBy,
        @Schema(description = "修改原因") String changeReason,
        @Schema(description = "创建时间") OffsetDateTime createdAt
) {
    public static VersionSnapshotResponse from(RecordVersion v) {
        return new VersionSnapshotResponse(
                v.getVersionNo(), v.getSnapshotJson(), v.getChangedBy(),
                v.getChangeReason(),
                v.getCreatedAt() != null
                        ? v.getCreatedAt().atOffset(ZoneOffset.ofHours(8))
                        : null
        );
    }
}
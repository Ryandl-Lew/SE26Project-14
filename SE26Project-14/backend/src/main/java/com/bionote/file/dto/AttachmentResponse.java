package com.bionote.file.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

/**
 * 文件附件响应体，用于文件上传成功后的接口返回。
 * <p>
 * 所有字段均使用 camelCase 序列化，{@code url} 为前端下载/预览的相对路径，
 * 前端需拼接 API 基地址后发起请求。
 */
@Schema(description = "文件附件响应体")
public record AttachmentResponse(
        @Schema(description = "附件唯一标识", example = "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
        String id,

        @Schema(description = "所属项目 ID", example = "proj-001")
        String projectId,

        @Schema(description = "所属实验记录 ID（可为空，表示项目级附件）", nullable = true, example = "rec-001")
        String recordId,

        @Schema(description = "用户上传时的原始文件名", example = "实验报告.pdf")
        String originalName,

        @Schema(description = "MIME 类型", example = "application/pdf")
        String mimeType,

        @Schema(description = "文件大小（字节）", example = "204800")
        Long size,

        @Schema(description = "前端下载/预览的相对路径，需拼接 API 基地址", example = "/api/v1/files/a1b2c3d4/download")
        String url,

        @Schema(description = "上传者用户名", example = "zhangsan")
        String uploadedBy,

        @Schema(description = "上传时间（带时区偏移）", example = "2026-07-14T10:30:00+08:00")
        OffsetDateTime createdAt,

        @Schema(description = "是否已软删除", example = "false")
        Boolean deleted
) {
}

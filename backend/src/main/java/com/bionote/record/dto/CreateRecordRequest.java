package com.bionote.record.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Schema(description = "创建实验记录请求")
public record CreateRecordRequest(
        @NotBlank(message = "项目 ID 不能为空")
        @Schema(description = "项目 ID") String projectId,

        @Schema(description = "模板 ID（可为空表示空白创建）") String templateId,

        @NotBlank(message = "标题不能为空")
        @Schema(description = "标题") String title,

        @NotBlank(message = "实验类型不能为空")
        @Schema(description = "实验类型") String experimentType,

        @NotNull(message = "实验日期不能为空")
        @Schema(description = "实验日期") LocalDate experimentDate,

        @Schema(description = "实验地点") String location
) {
}
package com.bionote.record.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

@Schema(description = "更新实验记录请求")
public record UpdateRecordRequest(
        @NotNull(message = "版本号不能为空")
        @Schema(description = "当前版本号（乐观锁）") Long version,

        @Schema(description = "标题") String title,

        @Schema(description = "实验类型") String experimentType,

        @Schema(description = "实验日期") LocalDate experimentDate,

        @Schema(description = "实验地点") String location,

        @Schema(description = "内容 JSON") String contentJson,

        @NotBlank(message = "修改原因不能为空")
        @Schema(description = "修改原因") String changeReason
) {
}
package com.bionote.record.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "复制实验记录请求")
public record RecordCopyRequest(
        @NotBlank(message = "新标题不能为空")
        @Schema(description = "新记录标题") String title
) {
}
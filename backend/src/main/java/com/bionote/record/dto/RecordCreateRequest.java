package com.bionote.record.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RecordCreateRequest(
        @NotBlank(message = "所属项目不能为空")
        String projectId,

        String templateId,

        @NotBlank(message = "记录标题不能为空")
        @Size(max = 255, message = "记录标题最长255个字符")
        String title,

        @NotBlank(message = "实验类型不能为空")
        @Size(max = 100, message = "实验类型最长100个字符")
        String experimentType,

        @NotBlank(message = "实验日期不能为空")
        String experimentDate,

        @Size(max = 255, message = "实验地点最长255个字符")
        String location
) {}

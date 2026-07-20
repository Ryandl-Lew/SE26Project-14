package com.bionote.record.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RecordUpdateRequest(
        @NotNull(message = "版本号不能为空")
        Long version,

        @NotBlank(message = "记录标题不能为空")
        @Size(max = 255, message = "记录标题最长255个字符")
        String title,

        @NotBlank(message = "实验类型不能为空")
        @Size(max = 100, message = "实验类型最长100个字符")
        String experimentType,

        @NotNull(message = "实验日期不能为空")
        LocalDate experimentDate,

        @Size(max = 255, message = "实验地点最长255个字符")
        String location,

        String content,

        @NotBlank(message = "变更原因不能为空")
        @Size(max = 500, message = "变更原因最长500个字符")
        String changeReason
) {}

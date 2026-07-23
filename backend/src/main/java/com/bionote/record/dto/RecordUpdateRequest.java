package com.bionote.record.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RecordUpdateRequest(
        Long version,

        @NotBlank(message = "记录标题不能为空")
        @Size(max = 255, message = "记录标题最长255个字符")
        String title,

        @NotBlank(message = "实验类型不能为空")
        @Size(max = 100, message = "实验类型最长100个字符")
        String experimentType,

        LocalDate experimentDate,

        @Size(max = 255, message = "实验地点最长255个字符")
        String location,

        String content,

        @Size(max = 500, message = "变更原因最长500个字符")
        String changeReason
) {}

package com.bionote.template.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TemplateFieldRequest(
        @NotBlank(message = "字段键不能为空")
        @Size(max = 100, message = "字段键最长100个字符")
        String fieldKey,

        @NotBlank(message = "字段标签不能为空")
        @Size(max = 200, message = "字段标签最长200个字符")
        String label,

        @NotBlank(message = "字段类型不能为空")
        @Size(max = 50, message = "字段类型最长50个字符")
        String fieldType,

        boolean required,

        @Size(max = 2000, message = "字段配置最长2000个字符")
        String configJson
) {
}

package com.bionote.template.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record TemplateCreateRequest(
        @NotBlank(message = "模板名称不能为空")
        @Size(max = 200, message = "模板名称最长200个字符")
        String name,

        @NotBlank(message = "模板分类不能为空")
        @Size(max = 64, message = "模板分类最长64个字符")
        String category,

        @Size(max = 2000, message = "模板描述最长2000个字符")
        String description,

        List<TemplateFieldRequest> fields
) {
}

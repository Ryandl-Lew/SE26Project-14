package com.bionote.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectUpdateRequest(
        @NotBlank(message = "项目名称不能为空")
        @Size(max = 200, message = "项目名称最长200个字符")
        String name,

        @Size(max = 2000, message = "项目描述最长2000个字符")
        String description,

        @NotNull(message = "版本号不能为空")
        Long version
) {}

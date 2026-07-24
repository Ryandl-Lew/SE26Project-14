package com.bionote.project.dto;

import jakarta.validation.constraints.NotBlank;

public record MemberRequest(
        @NotBlank(message = "用户ID不能为空")
        String userId,

        @NotBlank(message = "角色不能为空")
        String role
) {}

package com.bionote.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "用户名或邮箱不能为空")
        @Size(max = 255, message = "用户名或邮箱长度不能超过255个字符")
        String identifier,
        @NotBlank(message = "密码不能为空") String password
) {
}

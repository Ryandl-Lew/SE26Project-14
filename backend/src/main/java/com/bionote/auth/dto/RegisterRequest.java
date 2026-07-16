package com.bionote.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "用户名不能为空")
        @Pattern(
                regexp = "^[A-Za-z0-9._-]{3,64}$",
                message = "用户名只能包含字母、数字、点、下划线和短横线，长度为3到64个字符"
        )
        String username,

        @NotBlank(message = "邮箱不能为空")
        @Email(message = "邮箱格式不正确")
        @Size(max = 255, message = "邮箱长度不能超过255个字符")
        String email,

        @NotBlank(message = "密码不能为空")
        @Size(min = 8, max = 72, message = "密码长度必须为8到72个字符")
        String password,

        @NotBlank(message = "姓名不能为空")
        @Size(max = 100, message = "姓名长度不能超过100个字符")
        String name,

        @Size(max = 8, message = "头像文字长度不能超过8个字符")
        String avatarText,

        @Size(max = 128, message = "实验室邀请码长度不能超过128个字符")
        String labInviteCode,

        @Size(max = 500, message = "申请说明长度不能超过500个字符")
        String joinMessage
) {
}

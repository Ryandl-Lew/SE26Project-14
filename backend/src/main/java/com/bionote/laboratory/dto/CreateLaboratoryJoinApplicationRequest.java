package com.bionote.laboratory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateLaboratoryJoinApplicationRequest(
        @NotBlank(message = "实验室邀请码不能为空")
        @Size(max = 128, message = "实验室邀请码长度不能超过128个字符")
        String inviteCode,

        @Size(max = 500, message = "申请说明长度不能超过500个字符")
        String message
) {
}

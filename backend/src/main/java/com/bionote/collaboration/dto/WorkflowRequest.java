package com.bionote.collaboration.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record WorkflowRequest(
        @NotNull(message = "版本号不能为空")
        Long version,

        @Size(max = 500, message = "变更原因最长500个字符")
        String changeReason
) {
}

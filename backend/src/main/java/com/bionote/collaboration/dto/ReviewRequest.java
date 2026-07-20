package com.bionote.collaboration.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReviewRequest(
        @NotBlank(message = "审核决定不能为空")
        String decision,

        String reason,

        @NotNull(message = "版本号不能为空")
        Long version
) {
}

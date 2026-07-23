package com.bionote.collaboration.dto;

import jakarta.validation.constraints.NotBlank;

public record ReviewRequest(
        @NotBlank(message = "审核决定不能为空")
        String decision,

        String reason,

        Long version
) {
}

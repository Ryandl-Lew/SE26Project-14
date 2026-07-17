package com.bionote.collaboration.dto;

import com.bionote.collaboration.entity.ReviewDecision;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "审核请求")
public record ReviewRequest(
        @NotNull(message = "审核决定不能为空")
        @Schema(description = "审核决定：APPROVE 通过 / REJECT 退回") ReviewDecision decision,

        @NotBlank(message = "审核原因不能为空")
        @Schema(description = "审核原因") String reason,

        @NotNull(message = "版本号不能为空")
        @Schema(description = "当前版本号（乐观锁）") Long version
) {
}
package com.bionote.collaboration.dto;

import com.bionote.collaboration.entity.ReviewDecision;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "审核请求")
public record ReviewRequest(
        @NotNull(message = "审核决定不能为空")
        @Schema(description = "审核决定：APPROVE 通过 / REJECT 退回") ReviewDecision decision,

        @Size(max = 1000, message = "审核原因最长1000个字符")
        @Schema(description = "审核原因") String reason,

        @NotNull(message = "版本号不能为空")
        @Schema(description = "当前版本号（乐观锁）") Long version
) {
}

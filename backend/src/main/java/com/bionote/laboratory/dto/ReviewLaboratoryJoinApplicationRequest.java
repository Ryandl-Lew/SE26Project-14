package com.bionote.laboratory.dto;

import com.bionote.laboratory.entity.JoinReviewDecision;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ReviewLaboratoryJoinApplicationRequest(
        @NotNull(message = "审核决定不能为空")
        JoinReviewDecision decision,

        @Size(max = 1000, message = "审核意见长度不能超过1000个字符")
        String reason,

        @PositiveOrZero(message = "版本号不能为负数")
        long version
) {
}

package com.bionote.laboratory.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;

import java.time.Instant;

public record CreateLaboratoryInviteRequest(
        @Future(message = "邀请码过期时间必须晚于当前时间")
        Instant expiresAt,

        @Min(value = 1, message = "邀请码最大使用次数必须大于0")
        Integer maxUses
) {
}

package com.bionote.laboratory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ChangeLaboratoryLeaderRequest(
        @NotBlank(message = "实验室负责人不能为空")
        @Size(max = 255, message = "负责人账号长度不能超过255个字符")
        String leaderIdentifier,

        @PositiveOrZero(message = "版本号不能为负数")
        long version
) {
}

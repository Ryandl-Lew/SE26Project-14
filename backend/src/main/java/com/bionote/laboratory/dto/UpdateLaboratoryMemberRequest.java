package com.bionote.laboratory.dto;

import com.bionote.laboratory.entity.LaboratoryMemberStatus;
import com.bionote.laboratory.entity.LaboratoryRole;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateLaboratoryMemberRequest(
        @NotNull(message = "实验室角色不能为空")
        LaboratoryRole role,

        @NotNull(message = "成员状态不能为空")
        LaboratoryMemberStatus memberStatus,

        @PositiveOrZero(message = "版本号不能为负数")
        long version
) {
}

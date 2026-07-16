package com.bionote.laboratory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateLaboratoryRequest(
        @NotBlank(message = "实验室名称不能为空")
        @Size(max = 200, message = "实验室名称长度不能超过200个字符")
        String name,

        @NotBlank(message = "实验室描述不能为空")
        @Size(max = 5000, message = "实验室描述长度不能超过5000个字符")
        String description,

        @NotBlank(message = "实验室负责人不能为空")
        @Size(max = 255, message = "负责人账号长度不能超过255个字符")
        String leaderIdentifier
) {
}

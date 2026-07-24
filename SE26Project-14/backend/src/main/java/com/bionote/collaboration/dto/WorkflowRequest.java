package com.bionote.collaboration.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

public record WorkflowRequest(
        Long version,

        @Size(max = 500, message = "变更原因最长500个字符")
        String changeReason,

        List<String> reviewerIds
) {
}

package com.bionote.record.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.collaboration.dto.ReviewRequest;
import com.bionote.record.service.RecordWorkflowService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/records/{id}")
@Tag(name = "Workflow", description = "实验记录状态流转")
public class RecordWorkflowController {

    private final RecordWorkflowService workflowService;

    public RecordWorkflowController(RecordWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PostMapping("/start")
    @Operation(summary = "开始实验（DRAFT -> IN_PROGRESS）")
    public ApiResponse<Void> startRecord(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        workflowService.startRecord(id, principal.id());
        return ApiResponse.success();
    }

    @PostMapping("/submit")
    @Operation(summary = "提交审核（DRAFT/IN_PROGRESS/SUPPLEMENT -> PENDING_REVIEW）")
    public ApiResponse<Void> submitRecord(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        workflowService.submitRecord(id, principal.id());
        return ApiResponse.success();
    }

    @PostMapping("/review")
    @Operation(summary = "审核通过或退回（PENDING_REVIEW -> COMPLETED/REJECTED）")
    public ApiResponse<Void> reviewRecord(
            @PathVariable String id,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        workflowService.reviewRecord(id, request.decision(), request.reason(),
                request.version(), principal.id());
        return ApiResponse.success();
    }

    @PostMapping("/archive")
    @Operation(summary = "归档记录（任意状态 -> ARCHIVED）")
    public ApiResponse<Void> archiveRecord(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        workflowService.archiveRecord(id, principal.id());
        return ApiResponse.success();
    }
}
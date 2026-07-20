package com.bionote.collaboration.controller;

import com.bionote.collaboration.dto.*;
import com.bionote.collaboration.service.CollaborationService;
import com.bionote.common.api.ApiResponse;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/records")
@Tag(name = "Collaboration", description = "协作与审核")
public class CollaborationController {

    private final CollaborationService collaborationService;

    public CollaborationController(CollaborationService collaborationService) {
        this.collaborationService = collaborationService;
    }

    @PostMapping("/{recordId}/comments")
    @Operation(summary = "添加评论")
    public ApiResponse<CommentResponse> addComment(@PathVariable String recordId,
                                                    @Valid @RequestBody CommentRequest request,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(collaborationService.addComment(recordId, request, principal));
    }

    @GetMapping("/{recordId}/comments")
    @Operation(summary = "获取评论列表")
    public ApiResponse<List<CommentResponse>> getComments(@PathVariable String recordId) {
        return ApiResponse.success(collaborationService.getComments(recordId));
    }

    @PostMapping("/{recordId}/start")
    @Operation(summary = "开始记录（DRAFT → IN_PROGRESS）")
    public ApiResponse<Void> startRecord(@PathVariable String recordId,
                                          @Valid @RequestBody WorkflowRequest request,
                                          @AuthenticationPrincipal UserPrincipal principal) {
        collaborationService.startRecord(recordId, request, principal);
        return ApiResponse.success();
    }

    @PostMapping("/{recordId}/submit")
    @Operation(summary = "提交审核")
    public ApiResponse<Void> submitRecord(@PathVariable String recordId,
                                           @Valid @RequestBody WorkflowRequest request,
                                           @AuthenticationPrincipal UserPrincipal principal) {
        collaborationService.submitRecord(recordId, request, principal);
        return ApiResponse.success();
    }

    @PostMapping("/{recordId}/review")
    @Operation(summary = "审核记录（批准/驳回）")
    public ApiResponse<Void> reviewRecord(@PathVariable String recordId,
                                           @Valid @RequestBody ReviewRequest request,
                                           @AuthenticationPrincipal UserPrincipal principal) {
        collaborationService.reviewRecord(recordId, request, principal);
        return ApiResponse.success();
    }

    @PostMapping("/{recordId}/archive")
    @Operation(summary = "归档记录")
    public ApiResponse<Void> archiveRecord(@PathVariable String recordId,
                                            @Valid @RequestBody WorkflowRequest request,
                                            @AuthenticationPrincipal UserPrincipal principal) {
        collaborationService.archiveRecord(recordId, request, principal);
        return ApiResponse.success();
    }
}

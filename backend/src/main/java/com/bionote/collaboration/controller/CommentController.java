package com.bionote.collaboration.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.collaboration.dto.CommentRequest;
import com.bionote.collaboration.dto.CommentResponse;
import com.bionote.collaboration.service.CommentService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/records/{recordId}/comments")
@Tag(name = "Comments", description = "实验记录评论")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    @Operation(summary = "获取评论列表（按创建时间倒序）")
    public ApiResponse<List<CommentResponse>> listComments(
            @PathVariable String recordId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(commentService.listComments(recordId, principal.id()));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "添加评论")
    public ApiResponse<CommentResponse> addComment(
            @PathVariable String recordId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(commentService.addComment(recordId, request, principal.id()));
    }
}
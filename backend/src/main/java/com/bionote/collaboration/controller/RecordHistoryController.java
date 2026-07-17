package com.bionote.collaboration.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.collaboration.dto.ReviewResponse;
import com.bionote.collaboration.dto.VersionResponse;
import com.bionote.collaboration.dto.VersionSnapshotResponse;
import com.bionote.collaboration.service.ReviewQueryService;
import com.bionote.collaboration.service.VersionService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/records/{recordId}")
@Tag(name = "History", description = "实验记录版本与审核历史")
public class RecordHistoryController {

    private final VersionService versionService;
    private final ReviewQueryService reviewQueryService;

    public RecordHistoryController(VersionService versionService,
                                   ReviewQueryService reviewQueryService) {
        this.versionService = versionService;
        this.reviewQueryService = reviewQueryService;
    }

    @GetMapping("/versions")
    @Operation(summary = "获取版本列表")
    public ApiResponse<List<VersionResponse>> listVersions(
            @PathVariable String recordId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(versionService.listVersions(recordId, principal.id()));
    }

    @GetMapping("/versions/{versionNo}")
    @Operation(summary = "获取版本快照详情")
    public ApiResponse<VersionSnapshotResponse> getVersion(
            @PathVariable String recordId,
            @PathVariable Long versionNo,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(
                versionService.getVersion(recordId, versionNo, principal.id()));
    }

    @GetMapping("/reviews")
    @Operation(summary = "获取审核历史列表")
    public ApiResponse<List<ReviewResponse>> listReviews(
            @PathVariable String recordId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(reviewQueryService.listReviews(recordId, principal.id()));
    }
}
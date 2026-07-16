package com.bionote.laboratory.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.common.api.PageResponse;
import com.bionote.laboratory.dto.CreateLaboratoryJoinApplicationRequest;
import com.bionote.laboratory.dto.LaboratoryJoinApplicationResponse;
import com.bionote.laboratory.dto.ReviewLaboratoryJoinApplicationRequest;
import com.bionote.laboratory.entity.JoinApplicationStatus;
import com.bionote.laboratory.service.LaboratoryJoinApplicationService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1")
@Tag(name = "Laboratory Join Application", description = "实验室加入申请与审核")
public class LaboratoryJoinApplicationController {
    private final LaboratoryJoinApplicationService applicationService;

    public LaboratoryJoinApplicationController(
            LaboratoryJoinApplicationService applicationService
    ) {
        this.applicationService = applicationService;
    }

    @PostMapping("/laboratory-join-applications")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "使用邀请码申请加入实验室")
    public ApiResponse<LaboratoryJoinApplicationResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateLaboratoryJoinApplicationRequest request
    ) {
        return ApiResponse.success(applicationService.createLater(
                principal.id(), request.inviteCode(), request.message()));
    }

    @GetMapping("/laboratory-join-applications/mine")
    @Operation(summary = "查询我的实验室加入申请")
    public ApiResponse<PageResponse<LaboratoryJoinApplicationResponse>> mine(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ApiResponse.success(applicationService.mine(principal.id(), page, size));
    }

    @PostMapping("/laboratory-join-applications/{applicationId}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "取消待审核的实验室加入申请")
    public void cancel(
            @PathVariable String applicationId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        applicationService.cancel(applicationId, principal.id());
    }

    @GetMapping("/laboratories/{laboratoryId}/join-applications")
    @Operation(summary = "查询实验室加入申请")
    public ApiResponse<PageResponse<LaboratoryJoinApplicationResponse>> listForReview(
            @PathVariable String laboratoryId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "PENDING") JoinApplicationStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ApiResponse.success(applicationService.listForReview(
                laboratoryId, principal.id(), status, page, size));
    }

    @PostMapping("/laboratories/{laboratoryId}/join-applications/{applicationId}/review")
    @Operation(summary = "通过或拒绝实验室加入申请")
    public ApiResponse<LaboratoryJoinApplicationResponse> review(
            @PathVariable String laboratoryId,
            @PathVariable String applicationId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReviewLaboratoryJoinApplicationRequest request
    ) {
        return ApiResponse.success(applicationService.review(
                laboratoryId, applicationId, principal.id(), request));
    }
}

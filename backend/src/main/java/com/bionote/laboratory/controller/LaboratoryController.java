package com.bionote.laboratory.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.laboratory.dto.ChangeLaboratoryLeaderRequest;
import com.bionote.laboratory.dto.CreateLaboratoryRequest;
import com.bionote.laboratory.dto.LaboratoryMemberResponse;
import com.bionote.laboratory.dto.LaboratoryResponse;
import com.bionote.laboratory.service.LaboratoryService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/laboratories")
@Tag(name = "Laboratory", description = "实验室及负责人管理")
public class LaboratoryController {
    private final LaboratoryService laboratoryService;

    public LaboratoryController(LaboratoryService laboratoryService) {
        this.laboratoryService = laboratoryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "系统管理员创建实验室并设置负责人")
    public ApiResponse<LaboratoryResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateLaboratoryRequest request
    ) {
        return ApiResponse.success(laboratoryService.create(principal.id(), request));
    }

    @GetMapping("/{laboratoryId}")
    @Operation(summary = "获取实验室详情")
    public ApiResponse<LaboratoryResponse> get(
            @PathVariable String laboratoryId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.success(laboratoryService.get(laboratoryId, principal.id()));
    }

    @GetMapping("/mine")
    @Operation(summary = "获取当前用户所属实验室")
    public ApiResponse<List<LaboratoryMemberResponse>> mine(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ApiResponse.success(laboratoryService.mine(principal.id()));
    }

    @PatchMapping("/{laboratoryId}/leader")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "系统管理员转移实验室负责人")
    public ApiResponse<LaboratoryResponse> changeLeader(
            @PathVariable String laboratoryId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangeLaboratoryLeaderRequest request
    ) {
        return ApiResponse.success(laboratoryService.changeLeader(
                principal.id(), laboratoryId, request));
    }
}

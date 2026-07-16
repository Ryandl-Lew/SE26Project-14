package com.bionote.laboratory.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.common.api.PageResponse;
import com.bionote.laboratory.dto.CreateLaboratoryInviteRequest;
import com.bionote.laboratory.dto.CreatedLaboratoryInviteResponse;
import com.bionote.laboratory.dto.LaboratoryInviteResponse;
import com.bionote.laboratory.service.LaboratoryInviteService;
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
@RequestMapping("/api/v1/laboratories/{laboratoryId}/invites")
@Tag(name = "Laboratory Invite", description = "实验室邀请码管理")
public class LaboratoryInviteController {
    private final LaboratoryInviteService inviteService;

    public LaboratoryInviteController(LaboratoryInviteService inviteService) {
        this.inviteService = inviteService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "生成实验室邀请码")
    public ApiResponse<CreatedLaboratoryInviteResponse> create(
            @PathVariable String laboratoryId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateLaboratoryInviteRequest request
    ) {
        return ApiResponse.success(inviteService.create(
                laboratoryId, principal.id(), request));
    }

    @GetMapping
    @Operation(summary = "查询实验室邀请码")
    public ApiResponse<PageResponse<LaboratoryInviteResponse>> list(
            @PathVariable String laboratoryId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ApiResponse.success(inviteService.list(
                laboratoryId, principal.id(), page, size));
    }

    @PostMapping("/{inviteId}/revoke")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "撤销实验室邀请码")
    public void revoke(
            @PathVariable String laboratoryId,
            @PathVariable String inviteId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        inviteService.revoke(laboratoryId, inviteId, principal.id());
    }
}

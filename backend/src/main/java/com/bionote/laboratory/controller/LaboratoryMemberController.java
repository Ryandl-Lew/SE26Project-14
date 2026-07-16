package com.bionote.laboratory.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.common.api.PageResponse;
import com.bionote.laboratory.dto.LaboratoryMemberResponse;
import com.bionote.laboratory.dto.UpdateLaboratoryMemberRequest;
import com.bionote.laboratory.service.LaboratoryMemberService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/v1/laboratories/{laboratoryId}/members")
@Tag(name = "Laboratory Member", description = "实验室成员和角色管理")
public class LaboratoryMemberController {
    private final LaboratoryMemberService memberService;

    public LaboratoryMemberController(LaboratoryMemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    @Operation(summary = "查询实验室成员")
    public ApiResponse<PageResponse<LaboratoryMemberResponse>> list(
            @PathVariable String laboratoryId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ApiResponse.success(memberService.list(
                laboratoryId, principal.id(), page, size));
    }

    @PatchMapping("/{userId}")
    @Operation(summary = "修改实验室成员角色或状态")
    public ApiResponse<LaboratoryMemberResponse> update(
            @PathVariable String laboratoryId,
            @PathVariable String userId,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateLaboratoryMemberRequest request
    ) {
        return ApiResponse.success(memberService.update(
                laboratoryId, userId, principal.id(), request));
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "移除实验室成员")
    public void remove(
            @PathVariable String laboratoryId,
            @PathVariable String userId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        memberService.remove(laboratoryId, userId, principal.id());
    }
}

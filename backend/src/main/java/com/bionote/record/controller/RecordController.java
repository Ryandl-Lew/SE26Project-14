package com.bionote.record.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.common.api.PageResponse;
import com.bionote.record.dto.CreateRecordRequest;
import com.bionote.record.dto.RecordCopyRequest;
import com.bionote.record.dto.RecordDetailResponse;
import com.bionote.record.dto.RecordSummaryResponse;
import com.bionote.record.dto.UpdateRecordRequest;
import com.bionote.record.entity.RecordStatus;
import com.bionote.record.service.RecordService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.validation.annotation.Validated;

@RestController
@RequestMapping("/api/v1/records")
@Validated
@Tag(name = "Records", description = "实验记录 CRUD")
public class RecordController {

    private final RecordService recordService;

    public RecordController(RecordService recordService) {
        this.recordService = recordService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "创建实验记录（空白或从模板）")
    public ApiResponse<RecordDetailResponse> createRecord(
            @Valid @RequestBody CreateRecordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(recordService.createRecord(request, principal.id()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取实验记录详情")
    public ApiResponse<RecordDetailResponse> getRecord(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(recordService.getRecord(id, principal.id()));
    }

    @GetMapping
    @Operation(summary = "分页查询实验记录列表")
    public ApiResponse<PageResponse<RecordSummaryResponse>> listRecords(
            @Parameter(description = "项目 ID") @RequestParam String projectId,
            @Parameter(description = "状态筛选（可选）") @RequestParam(required = false) RecordStatus status,
            @Parameter(description = "负责人 ID（可选）") @RequestParam(required = false) String ownerId,
            @Parameter(description = "页码") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "每页条数") @RequestParam(defaultValue = "20")
            @Min(1) @Max(100) int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(PageResponse.from(
                recordService.listRecords(projectId, status, ownerId, page, size, principal.id()),
                r -> r));
    }

    @PutMapping("/{id}")
    @Operation(summary = "保存实验记录内容（含修改原因和版本号）")
    public ApiResponse<RecordDetailResponse> updateRecord(
            @PathVariable String id,
            @Valid @RequestBody UpdateRecordRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(recordService.updateRecord(id, request, principal.id()));
    }

    @PostMapping("/{id}/copy")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "复制为新的实验记录")
    public ApiResponse<RecordDetailResponse> copyRecord(
            @PathVariable String id,
            @Valid @RequestBody RecordCopyRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(recordService.copyRecord(id, request.title(), principal.id()));
    }
}

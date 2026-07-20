package com.bionote.record.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.common.api.PageResponse;
import com.bionote.record.dto.*;
import com.bionote.record.service.RecordService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/records")
@Tag(name = "Records", description = "实验记录")
public class RecordController {

    private final RecordService recordService;

    public RecordController(RecordService recordService) {
        this.recordService = recordService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "创建实验记录")
    public ApiResponse<RecordResponse> createRecord(@Valid @RequestBody RecordCreateRequest request,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(recordService.createRecord(request, principal));
    }

    @GetMapping
    @Operation(summary = "分页查询实验记录列表")
    public ApiResponse<PageResponse<RecordResponse>> listRecords(RecordFilter filter) {
        return ApiResponse.success(recordService.listRecords(filter));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取实验记录详情")
    public ApiResponse<RecordResponse> getRecord(@PathVariable String id) {
        return ApiResponse.success(recordService.getRecord(id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新实验记录内容")
    public ApiResponse<RecordResponse> updateRecord(@PathVariable String id,
                                                    @Valid @RequestBody RecordUpdateRequest request,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(recordService.updateRecord(id, request, principal));
    }

    @PostMapping("/{id}/copy")
    @Operation(summary = "复制实验记录")
    public ApiResponse<RecordResponse> copyRecord(@PathVariable String id,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(recordService.copyRecord(id, principal));
    }

    @GetMapping("/{id}/versions")
    @Operation(summary = "获取实验记录版本列表")
    public ApiResponse<List<RecordVersionResponse>> getVersions(@PathVariable String id) {
        return ApiResponse.success(recordService.getVersions(id));
    }

    @GetMapping("/{id}/versions/{versionNo}")
    @Operation(summary = "获取实验记录特定版本详情")
    public ApiResponse<RecordVersionResponse> getVersion(@PathVariable String id,
                                                         @PathVariable Long versionNo) {
        return ApiResponse.success(recordService.getVersion(id, versionNo));
    }
}

package com.bionote.template.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.template.dto.TemplateListResponse;
import com.bionote.template.dto.TemplateResponse;
import com.bionote.template.dto.CreateTemplateRequest;
import com.bionote.template.dto.UpdateTemplateRequest;
import com.bionote.template.service.TemplateService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/v1/templates")
@Tag(name = "Templates", description = "实验模板查询")
public class TemplateController {
    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    @Operation(summary = "获取模板列表，可按 category 筛选")
    public ApiResponse<List<TemplateListResponse>> listTemplates(
            @RequestParam(required = false) String category) {
        return ApiResponse.success(templateService.listTemplates(category));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取模板及按 sortOrder 排序的字段详情")
    public ApiResponse<TemplateResponse> getTemplate(@PathVariable String id) {
        return ApiResponse.success(templateService.getTemplate(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "创建自定义模板及字段")
    public ApiResponse<TemplateResponse> createTemplate(
            @Valid @RequestBody CreateTemplateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(templateService.createTemplate(request, principal.id()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "更新自己创建的自定义模板和字段")
    public ApiResponse<TemplateResponse> updateTemplate(
            @PathVariable String id,
            @Valid @RequestBody UpdateTemplateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(templateService.updateTemplate(id, request, principal.id()));
    }
}

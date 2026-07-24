package com.bionote.template.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.security.UserPrincipal;
import com.bionote.template.dto.TemplateCreateRequest;
import com.bionote.template.dto.TemplateListResponse;
import com.bionote.template.dto.TemplateResponse;
import com.bionote.template.dto.TemplateUpdateRequest;
import com.bionote.template.service.TemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/templates")
@Tag(name = "Templates", description = "实验模板")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    @Operation(summary = "获取模板列表")
    public ApiResponse<List<TemplateListResponse>> listTemplates(
            @RequestParam(required = false) String category) {
        return ApiResponse.success(templateService.listTemplates(category));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取模板详情")
    public ApiResponse<TemplateResponse> getTemplate(@PathVariable String id) {
        return ApiResponse.success(templateService.getTemplate(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "创建自定义模板")
    public ApiResponse<TemplateResponse> createTemplate(
            @Valid @RequestBody TemplateCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(templateService.createTemplate(request, principal));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "更新模板信息")
    public ApiResponse<TemplateResponse> updateTemplate(
            @PathVariable String id,
            @Valid @RequestBody TemplateUpdateRequest request) {
        return ApiResponse.success(templateService.updateTemplate(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "删除自定义模板")
    public ApiResponse<Void> deleteTemplate(@PathVariable String id) {
        templateService.deleteTemplate(id);
        return ApiResponse.success();
    }

    @PostMapping("/{id}/favorite")
    @Operation(summary = "收藏模板")
    public ApiResponse<Void> favoriteTemplate(@PathVariable String id,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        templateService.addFavorite(id, principal);
        return ApiResponse.success();
    }

    @DeleteMapping("/{id}/favorite")
    @Operation(summary = "取消收藏模板")
    public ApiResponse<Void> unfavoriteTemplate(@PathVariable String id,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        templateService.removeFavorite(id, principal);
        return ApiResponse.success();
    }

    @GetMapping("/favorites")
    @Operation(summary = "获取已收藏的模板ID列表")
    public ApiResponse<List<String>> getFavoriteTemplateIds(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(templateService.getFavoriteTemplateIds(principal));
    }
}

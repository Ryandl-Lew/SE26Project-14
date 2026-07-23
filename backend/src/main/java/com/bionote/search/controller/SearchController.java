package com.bionote.search.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.common.api.PageResponse;
import com.bionote.search.dto.SearchHit;
import com.bionote.search.service.SearchService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Validated
@Tag(name = "Search", description = "全局搜索与项目内搜索")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping("/search")
    @Operation(
            summary = "全局/项目内搜索",
            description = """
                    在用户可访问的项目范围内搜索。支持跨项目、实验记录和文件附件进行关键词匹配。
                    传入 projectId 可限定在指定项目内搜索，不传则搜索所有可访问项目。"""
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "搜索结果（分页）",
                    content = @Content(schema = @Schema(implementation = SearchHit.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "400",
                    description = "keyword 参数缺失或为空"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "无权访问指定的 projectId")
    })
    public ApiResponse<PageResponse<SearchHit>> search(
            @Parameter(description = "搜索关键词（必填）", required = true, example = "PCR")
            @RequestParam @NotBlank String keyword,

            @Parameter(description = "限定项目 ID（可选，不传则全局搜索）", example = "p-001")
            @RequestParam(required = false) String projectId,

            @Parameter(description = "页码（0-based）", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "每页条数", example = "20")
            @RequestParam(defaultValue = "20") int size,

            @AuthenticationPrincipal UserPrincipal principal) {

        PageResponse<SearchHit> result = searchService.search(
                keyword, projectId, principal.id(), page, size);
        return ApiResponse.success(result);
    }
}

package com.bionote.search.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.common.api.PageResponse;
import com.bionote.search.dto.SearchHit;
import com.bionote.search.service.DatabaseSearchService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 搜索 REST 接口。
 *
 * <h3>接口说明</h3>
 * <ul>
 *   <li>全局搜索（不传 {@code projectId}）：在用户可访问的所有项目范围内搜索。</li>
 *   <li>项目内搜索（传入 {@code projectId}）：限定在指定项目范围内搜索，
 *       若用户无权访问该项目则返回 403。</li>
 * </ul>
 *
 * @see DatabaseSearchService
 * @see SearchHit
 */
@RestController
@RequestMapping("/api/v1")
@Validated
@Tag(name = "Search", description = "全局搜索与项目内搜索")
public class SearchController {

    private final DatabaseSearchService searchService;

    public SearchController(DatabaseSearchService searchService) {
        this.searchService = searchService;
    }

    // ──────────────────────────────────────────────
    // 搜索
    // ──────────────────────────────────────────────

    @GetMapping("/search")
    @Operation(
            summary = "全局/项目内搜索",
            description = """
                    在用户可访问的项目范围内搜索项目、实验记录、模板和文件附件。
                    传入 projectId 时还会搜索项目成员活动；不传则搜索所有可访问项目。"""
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
            @RequestParam @NotBlank @Size(max = 100)
            String keyword,

            @Parameter(description = "限定项目 ID（可选，不传则全局搜索）")
            @RequestParam(required = false)
            String projectId,

            @Parameter(description = "页码（0-based）", example = "0")
            @RequestParam(defaultValue = "0")
            @Min(0) int page,

            @Parameter(description = "每页条数", example = "20")
            @RequestParam(defaultValue = "20")
            @Min(1) @Max(100) int size,

            @AuthenticationPrincipal UserPrincipal principal) {

        PageResponse<SearchHit> result = searchService.search(
                keyword, projectId, principal.id(), page, size);
        return ApiResponse.success(result);
    }
}

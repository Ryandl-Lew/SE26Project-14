package com.bionote.dashboard.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.dashboard.dto.ProjectStatisticsResponse;
import com.bionote.dashboard.service.ProjectStatisticsService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/statistics")
@Tag(name = "Statistics", description = "项目记录状态、审核和趋势聚合")
public class ProjectStatisticsController {
    private final ProjectStatisticsService statisticsService;

    public ProjectStatisticsController(ProjectStatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping
    @Operation(summary = "获取当前成员可访问项目的简单统计和趋势")
    public ApiResponse<ProjectStatisticsResponse> getStatistics(
            @PathVariable String projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(statisticsService.getStatistics(projectId, principal.id()));
    }
}

package com.bionote.dashboard.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.dashboard.dto.DashboardResponse;
import com.bionote.dashboard.service.DashboardService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "工作台聚合数据")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    @Operation(summary = "获取工作台聚合数据")
    public ApiResponse<DashboardResponse> getDashboard(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(dashboardService.getDashboard(principal));
    }
}

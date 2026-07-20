package com.bionote.collaboration.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.common.api.PageResponse;
import com.bionote.collaboration.dto.ActivityResponse;
import com.bionote.collaboration.service.ActivityQueryService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/activities")
@Tag(name = "Activities", description = "项目活动动态")
public class ActivityController {

    private final ActivityQueryService activityQueryService;

    public ActivityController(ActivityQueryService activityQueryService) {
        this.activityQueryService = activityQueryService;
    }

    @GetMapping
    @Operation(summary = "获取项目活动列表（分页）")
    public ApiResponse<PageResponse<ActivityResponse>> listActivities(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {
        var result = activityQueryService.listActivities(projectId, page, size, principal.id());
        return ApiResponse.success(PageResponse.from(result, r -> r));
    }
}
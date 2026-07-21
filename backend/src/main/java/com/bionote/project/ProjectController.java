package com.bionote.project;

import com.bionote.common.api.ApiResponse;
import com.bionote.common.api.PageResponse;
import com.bionote.project.dto.*;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/projects")
@Tag(name = "项目管理", description = "项目的创建、查询、编辑、归档和动态")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "创建项目")
    public ApiResponse<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request,
                                                      @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(projectService.createProject(request, principal));
    }

    @GetMapping
    @Operation(summary = "分页查询项目列表")
    public ApiResponse<PageResponse<ProjectResponse>> listProjects(
            ProjectFilter filter,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(projectService.listProjects(filter, principal.id()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取项目详情")
    public ApiResponse<ProjectResponse> getProject(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(projectService.getProject(id, principal.id()));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "编辑项目基本信息")
    public ApiResponse<ProjectResponse> updateProject(@PathVariable String id,
                                                      @Valid @RequestBody ProjectUpdateRequest request,
                                                      @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(projectService.updateProject(id, request, principal));
    }

    @PostMapping("/{id}/archive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "由项目 OWNER 直接归档项目")
    public void archiveProject(@PathVariable String id,
                               @AuthenticationPrincipal UserPrincipal principal) {
        projectService.archiveProject(id, principal);
    }
}

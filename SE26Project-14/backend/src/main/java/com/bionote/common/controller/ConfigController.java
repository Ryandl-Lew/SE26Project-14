package com.bionote.common.controller;

import com.bionote.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Config", description = "系统配置")
public class ConfigController {

    @GetMapping("/permissions")
    @Operation(summary = "获取角色权限矩阵")
    public ApiResponse<List<Map<String, Object>>> getPermissionMatrix() {
        return ApiResponse.success(List.of(
                Map.of("permission", "查看项目",
                        "values", Map.of("owner", "yes", "member", "yes", "reviewer", "yes", "observer", "yes")),
                Map.of("permission", "编辑项目信息",
                        "values", Map.of("owner", "yes", "member", "no", "reviewer", "no", "observer", "no")),
                Map.of("permission", "新建实验记录",
                        "values", Map.of("owner", "yes", "member", "yes", "reviewer", "optional", "observer", "no")),
                Map.of("permission", "审核实验记录",
                        "values", Map.of("owner", "yes", "member", "no", "reviewer", "yes", "observer", "no")),
                Map.of("permission", "管理项目成员",
                        "values", Map.of("owner", "yes", "member", "no", "reviewer", "no", "observer", "no")),
                Map.of("permission", "上传项目附件",
                        "values", Map.of("owner", "yes", "member", "yes", "reviewer", "optional", "observer", "no"))
        ));
    }
}

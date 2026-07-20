package com.bionote.project;

import com.bionote.common.api.ApiResponse;
import com.bionote.project.dto.*;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/members")
@Tag(name = "成员管理", description = "项目成员的添加、查询、更新和移除")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @GetMapping
    @Operation(summary = "获取项目成员列表")
    public ApiResponse<List<MemberResponse>> listMembers(@PathVariable String projectId) {
        return ApiResponse.success(memberService.listMembers(projectId));
    }

    @PostMapping
    @Operation(summary = "添加项目成员")
    public ApiResponse<MemberResponse> addMember(@PathVariable String projectId,
                                                 @Valid @RequestBody MemberRequest request,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(memberService.addMember(projectId, request, principal));
    }

    @PatchMapping("/{userId}")
    @Operation(summary = "修改成员角色或状态")
    public ApiResponse<MemberResponse> updateMember(@PathVariable String projectId,
                                                    @PathVariable String userId,
                                                    @RequestBody MemberUpdateRequest request,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(memberService.updateMember(projectId, userId, request, principal));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "移除成员")
    public ApiResponse<Void> removeMember(@PathVariable String projectId,
                                          @PathVariable String userId,
                                          @AuthenticationPrincipal UserPrincipal principal) {
        memberService.removeMember(projectId, userId, principal);
        return ApiResponse.success();
    }
}

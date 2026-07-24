package com.bionote.user.controller;

import com.bionote.auth.dto.UserResponse;
import com.bionote.common.api.ApiResponse;
import com.bionote.security.UserPrincipal;
import com.bionote.user.entity.User;
import com.bionote.user.entity.UserStatus;
import com.bionote.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "用户", description = "用户查询")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    @Operation(summary = "获取所有活跃用户列表")
    public ApiResponse<List<UserResponse>> listUsers(@AuthenticationPrincipal UserPrincipal principal) {
        List<User> users = userRepository.findAll();
        List<UserResponse> activeUsers = users.stream()
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .map(UserResponse::from)
                .toList();
        return ApiResponse.success(activeUsers);
    }
}

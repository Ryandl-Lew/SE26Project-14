package com.bionote.auth.controller;

import com.bionote.auth.dto.LoginRequest;
import com.bionote.auth.dto.LoginResponse;
import com.bionote.auth.dto.RegisterRequest;
import com.bionote.auth.dto.RegisterResponse;
import com.bionote.auth.dto.UserResponse;
import com.bionote.auth.service.AuthService;
import com.bionote.common.api.ApiResponse;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "登录和当前会话")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "用户名或邮箱登录")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "注册账号，可选实验室邀请码")
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @GetMapping("/me")
    @Operation(summary = "获取当前登录用户")
    public ApiResponse<UserResponse> currentUser(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(authService.currentUser(principal.id()));
    }

    @PostMapping("/logout")
    @Operation(summary = "退出登录；无状态 JWT 由客户端删除")
    public ApiResponse<Void> logout() {
        return ApiResponse.success();
    }
}

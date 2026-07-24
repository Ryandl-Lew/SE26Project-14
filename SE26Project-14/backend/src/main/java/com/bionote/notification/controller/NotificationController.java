package com.bionote.notification.controller;

import com.bionote.common.api.ApiResponse;
import com.bionote.notification.dto.NotificationResponse;
import com.bionote.notification.service.NotificationService;
import com.bionote.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications", description = "通知消息")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "获取当前用户的通知列表")
    public ApiResponse<List<NotificationResponse>> listNotifications(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(notificationService.listNotifications(principal.id()));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "获取未读通知数量")
    public ApiResponse<Long> unreadCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.success(notificationService.unreadCount(principal.id()));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "标记单条通知为已读")
    public ApiResponse<Void> markAsRead(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAsRead(id, principal.id());
        return ApiResponse.success();
    }

    @PostMapping("/read-all")
    @Operation(summary = "全部标记为已读")
    public ApiResponse<Void> markAllAsRead(
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.id());
        return ApiResponse.success();
    }
}

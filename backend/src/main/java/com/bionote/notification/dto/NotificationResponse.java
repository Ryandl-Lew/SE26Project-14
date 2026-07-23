package com.bionote.notification.dto;

import com.bionote.notification.entity.Notification;

import java.time.Instant;

public record NotificationResponse(
        String id,
        String title,
        String type,
        String description,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getType(),
                notification.getDescription(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}

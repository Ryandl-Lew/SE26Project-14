package com.bionote.auth.dto;

import com.bionote.user.entity.User;

public record UserResponse(
        String id,
        String username,
        String name,
        String email,
        String avatarText
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                user.getAvatarText()
        );
    }
}

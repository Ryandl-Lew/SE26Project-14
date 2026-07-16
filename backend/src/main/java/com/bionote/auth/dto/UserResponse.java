package com.bionote.auth.dto;

import com.bionote.user.entity.User;
import com.bionote.user.entity.SystemRole;

public record UserResponse(
        String id,
        String username,
        String name,
        String email,
        String avatarText,
        SystemRole systemRole
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                user.getAvatarText(),
                user.getSystemRole()
        );
    }
}

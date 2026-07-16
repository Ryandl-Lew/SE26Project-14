package com.bionote.laboratory.dto;

import com.bionote.user.entity.User;

public record UserSummaryResponse(
        String id,
        String username,
        String name,
        String email
) {
    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail()
        );
    }
}

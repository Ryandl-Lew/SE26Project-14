package com.bionote.auth.dto;

import com.bionote.laboratory.dto.RegistrationJoinApplicationResponse;

public record RegisterResponse(
        UserResponse user,
        RegistrationJoinApplicationResponse joinApplication
) {
}

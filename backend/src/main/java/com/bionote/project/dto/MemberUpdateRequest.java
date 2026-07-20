package com.bionote.project.dto;

public record MemberUpdateRequest(
        String role,
        String memberStatus
) {}

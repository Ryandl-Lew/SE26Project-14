package com.bionote.laboratory.dto;

public record CreatedLaboratoryInviteResponse(
        String inviteCode,
        LaboratoryInviteResponse invite
) {
}

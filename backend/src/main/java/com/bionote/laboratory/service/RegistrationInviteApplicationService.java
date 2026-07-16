package com.bionote.laboratory.service;

import com.bionote.laboratory.dto.RegistrationJoinApplicationResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationInviteApplicationService {
    private final LaboratoryJoinApplicationService applicationService;

    public RegistrationInviteApplicationService(LaboratoryJoinApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public RegistrationJoinApplicationResponse createForRegistration(
            String userId,
            String inviteCode,
            String joinMessage
    ) {
        return applicationService.createForRegistration(userId, inviteCode, joinMessage);
    }
}

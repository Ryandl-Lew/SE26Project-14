package com.bionote.collaboration.service;

import com.bionote.collaboration.entity.Activity;
import com.bionote.collaboration.repository.ActivityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final ActivityRepository activityRepository;

    public AuditService(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    @Transactional
    public void log(String projectId,
                    String actorId,
                    String action,
                    String targetType,
                    String targetId,
                    String summary) {
        activityRepository.save(new Activity(
                projectId, actorId, action, targetType, targetId, summary));
    }

    @Transactional
    public void logRecord(String projectId,
                          String actorId,
                          String action,
                          String recordId,
                          String summary) {
        log(projectId, actorId, action, "RECORD", recordId, summary);
    }

    @Transactional
    public void logProject(String projectId,
                           String actorId,
                           String action,
                           String summary) {
        log(projectId, actorId, action, "PROJECT", projectId, summary);
    }

    @Transactional
    public void logMember(String projectId,
                          String actorId,
                          String action,
                          String memberUserId,
                          String summary) {
        log(projectId, actorId, action, "MEMBER", memberUserId, summary);
    }
}

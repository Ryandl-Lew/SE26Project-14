package com.bionote.collaboration.service;

import com.bionote.collaboration.dto.ActivityResponse;
import com.bionote.project.ActivityRepository;
import com.bionote.project.service.ProjectAccessService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityQueryService {

    private final ActivityRepository activityRepository;
    private final ProjectAccessService accessService;

    public ActivityQueryService(ActivityRepository activityRepository,
                                ProjectAccessService accessService) {
        this.activityRepository = activityRepository;
        this.accessService = accessService;
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> listActivities(String projectId,
                                                  int page,
                                                  int size,
                                                  String currentUserId) {
        accessService.requireCanRead(projectId, currentUserId);
        return activityRepository
                .findByProjectIdOrderByCreatedAtDesc(projectId, PageRequest.of(page, size))
                .map(ActivityResponse::from);
    }
}

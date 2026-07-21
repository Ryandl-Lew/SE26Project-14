package com.bionote.dashboard.service;

import com.bionote.collaboration.dto.ActivityResponse;
import com.bionote.dashboard.dto.DashboardResponse;
import com.bionote.dashboard.dto.PendingTaskInfo;
import com.bionote.dashboard.dto.SimpleProjectInfo;
import com.bionote.dashboard.dto.SimpleRecordInfo;
import com.bionote.project.ActivityRepository;
import com.bionote.project.ProjectRepository;
import com.bionote.project.entity.Project;
import com.bionote.project.entity.ProjectRole;
import com.bionote.project.service.ProjectAccessService;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DashboardService {
    private static final int RECENT_LIMIT = 5;

    private final ProjectAccessService accessService;
    private final ProjectRepository projectRepository;
    private final ExperimentRecordRepository recordRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    public DashboardService(ProjectAccessService accessService,
                            ProjectRepository projectRepository,
                            ExperimentRecordRepository recordRepository,
                            ActivityRepository activityRepository,
                            UserRepository userRepository) {
        this.accessService = accessService;
        this.projectRepository = projectRepository;
        this.recordRepository = recordRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String currentUserId) {
        List<String> accessibleProjectIds = accessService.getAccessibleProjectIds(currentUserId);
        if (accessibleProjectIds.isEmpty()) {
            return new DashboardResponse(0, 0, 0, 0,
                    List.of(), List.of(), List.of(), List.of(), List.of());
        }

        long totalRecords = recordRepository.countByProjectIdInAndStatusNot(
                accessibleProjectIds, RecordStatus.ARCHIVED);
        long inProgressRecords = recordRepository.countByProjectIdInAndStatus(
                accessibleProjectIds, RecordStatus.IN_PROGRESS);
        long pendingReviewRecords = recordRepository.countByProjectIdInAndStatus(
                accessibleProjectIds, RecordStatus.PENDING_REVIEW);

        List<Project> recentProjects = projectRepository.findByIdIn(
                accessibleProjectIds,
                PageRequest.of(0, RECENT_LIMIT, Sort.by(Sort.Direction.DESC, "updatedAt")))
                .getContent();
        List<ExperimentRecord> recentRecords = recordRepository
                .findByProjectIdInAndStatusNotOrderByUpdatedAtDesc(
                        accessibleProjectIds, RecordStatus.ARCHIVED,
                        PageRequest.of(0, RECENT_LIMIT))
                .getContent();

        List<String> reviewableProjectIds = accessService.getAccessibleProjectIdsByRoles(
                currentUserId, EnumSet.of(ProjectRole.OWNER, ProjectRole.REVIEWER));
        List<ExperimentRecord> pendingReviewTasks = reviewableProjectIds.isEmpty()
                ? List.of()
                : recordRepository.findByProjectIdInAndStatusAndOwnerIdNotOrderByUpdatedAtDesc(
                        reviewableProjectIds, RecordStatus.PENDING_REVIEW, currentUserId,
                        PageRequest.of(0, 10)).getContent();

        List<ExperimentRecord> supplementTasks = recordRepository
                .findByProjectIdInAndOwnerIdAndStatusInOrderByUpdatedAtDesc(
                        accessibleProjectIds, currentUserId,
                        List.of(RecordStatus.REJECTED, RecordStatus.SUPPLEMENT),
                        PageRequest.of(0, 10)).getContent();

        Map<String, Project> projects = loadProjects(accessibleProjectIds);
        List<String> userIds = new ArrayList<>();
        recentProjects.forEach(project -> userIds.add(project.getOwnerId()));
        recentRecords.forEach(record -> userIds.add(record.getOwnerId()));
        pendingReviewTasks.forEach(record -> userIds.add(record.getOwnerId()));
        supplementTasks.forEach(record -> userIds.add(record.getOwnerId()));
        Map<String, User> users = loadUsers(userIds);

        List<SimpleProjectInfo> recentProjectInfos = recentProjects.stream()
                .map(project -> new SimpleProjectInfo(
                        project.getId(), project.getCode(), project.getName(),
                        project.getStatus().name(), project.getOwnerId(),
                        userName(users, project.getOwnerId()), project.getUpdatedAt(),
                        "/projects/" + project.getId()))
                .toList();
        List<SimpleRecordInfo> recentRecordInfos = recentRecords.stream()
                .map(record -> toRecordInfo(record, projects, users))
                .toList();

        List<ActivityResponse> recentActivities = activityRepository
                .findByProjectIdInOrderByCreatedAtDesc(
                        accessibleProjectIds, PageRequest.of(0, 10))
                .map(ActivityResponse::from)
                .getContent();

        return new DashboardResponse(
                accessibleProjectIds.size(), totalRecords, inProgressRecords, pendingReviewRecords,
                recentProjectInfos, recentRecordInfos,
                pendingReviewTasks.stream()
                        .map(record -> toTask("REVIEW", record, projects, users)).toList(),
                supplementTasks.stream()
                        .map(record -> toTask("SUPPLEMENT", record, projects, users)).toList(),
                recentActivities);
    }

    private SimpleRecordInfo toRecordInfo(ExperimentRecord record,
                                          Map<String, Project> projects,
                                          Map<String, User> users) {
        return new SimpleRecordInfo(
                record.getId(), record.getCode(), record.getTitle(), record.getProjectId(),
                projectName(projects, record.getProjectId()), record.getStatus().name(),
                record.getOwnerId(), userName(users, record.getOwnerId()), record.getUpdatedAt(),
                recordUrl(record));
    }

    private PendingTaskInfo toTask(String type,
                                   ExperimentRecord record,
                                   Map<String, Project> projects,
                                   Map<String, User> users) {
        return new PendingTaskInfo(
                type.toLowerCase() + ":" + record.getId(), type, record.getId(),
                record.getTitle(), record.getProjectId(),
                projectName(projects, record.getProjectId()), record.getOwnerId(),
                userName(users, record.getOwnerId()), record.getUpdatedAt(), recordUrl(record));
    }

    private String recordUrl(ExperimentRecord record) {
        return "/projects/" + record.getProjectId() + "/records/" + record.getId();
    }

    private Map<String, Project> loadProjects(Collection<String> ids) {
        return projectRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Project::getId, Function.identity()));
    }

    private Map<String, User> loadUsers(Collection<String> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(ids.stream().distinct().toList()).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private String projectName(Map<String, Project> projects, String id) {
        return projects.containsKey(id) ? projects.get(id).getName() : "未知项目";
    }

    private String userName(Map<String, User> users, String id) {
        return users.containsKey(id) ? users.get(id).getName() : "未知用户";
    }
}

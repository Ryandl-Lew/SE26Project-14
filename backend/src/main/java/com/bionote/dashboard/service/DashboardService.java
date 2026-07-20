package com.bionote.dashboard.service;

import com.bionote.dashboard.dto.DashboardResponse;
import com.bionote.dashboard.dto.PendingTaskInfo;
import com.bionote.dashboard.dto.SimpleProjectInfo;
import com.bionote.dashboard.dto.SimpleRecordInfo;
import com.bionote.project.MemberRepository;
import com.bionote.project.ProjectRepository;
import com.bionote.project.entity.Project;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.bionote.security.UserPrincipal;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final ExperimentRecordRepository experimentRecordRepository;
    private final UserRepository userRepository;
    private final MemberRepository memberRepository;

    public DashboardService(ProjectRepository projectRepository,
                            ExperimentRecordRepository experimentRecordRepository,
                            UserRepository userRepository,
                            MemberRepository memberRepository) {
        this.projectRepository = projectRepository;
        this.experimentRecordRepository = experimentRecordRepository;
        this.userRepository = userRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UserPrincipal principal) {
        long totalProjects = projectRepository.count();
        long totalRecords = experimentRecordRepository.countByStatusNot(RecordStatus.ARCHIVED);
        long inProgressRecords = experimentRecordRepository.countByStatus(RecordStatus.IN_PROGRESS);
        long pendingReviewRecords = experimentRecordRepository.countByStatus(RecordStatus.PENDING_REVIEW);

        List<Project> recentProjects = projectRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();

        List<ExperimentRecord> recentRecords = experimentRecordRepository
                .findTop5ByStatusNotOrderByUpdatedAtDesc(RecordStatus.ARCHIVED);

        List<ExperimentRecord> pendingRecords = experimentRecordRepository
                .findPendingTasks(principal.id());

        List<String> userIds = recentRecords.stream()
                .map(ExperimentRecord::getOwnerId)
                .collect(Collectors.toList());
        userIds.addAll(recentProjects.stream().map(Project::getOwnerId).toList());
        userIds.addAll(pendingRecords.stream().map(ExperimentRecord::getOwnerId).toList());

        List<String> projectIds = recentRecords.stream()
                .map(ExperimentRecord::getProjectId)
                .collect(Collectors.toList());
        projectIds.addAll(pendingRecords.stream()
                .map(ExperimentRecord::getProjectId)
                .toList());

        List<User> users = userRepository.findAllById(userIds.stream().distinct().toList());
        Map<String, String> userNameMap = users.stream()
                .collect(Collectors.toMap(User::getId, User::getName));

        List<Project> projects = projectRepository.findAllById(projectIds.stream().distinct().toList());
        Map<String, String> projectNameMap = projects.stream()
                .collect(Collectors.toMap(Project::getId, Project::getName));

        List<SimpleProjectInfo> recentProjectInfos = recentProjects.stream()
                .map(p -> new SimpleProjectInfo(
                        p.getId(),
                        p.getCode(),
                        p.getName(),
                        p.getStatus().name(),
                        userNameMap.getOrDefault(p.getOwnerId(), "未知"),
                        p.getCreatedAt()
                ))
                .toList();

        List<SimpleRecordInfo> recentRecordInfos = recentRecords.stream()
                .map(r -> new SimpleRecordInfo(
                        r.getId(),
                        r.getCode(),
                        r.getTitle(),
                        r.getProjectId(),
                        projectNameMap.getOrDefault(r.getProjectId(), "未知"),
                        r.getStatus().name(),
                        userNameMap.getOrDefault(r.getOwnerId(), "未知"),
                        r.getUpdatedAt()
                ))
                .toList();

        List<PendingTaskInfo> pendingTaskInfos = pendingRecords.stream()
                .map(r -> {
                    String type = r.getStatus() == RecordStatus.REJECTED ? "SUPPLEMENT" : "REVIEW";
                    return new PendingTaskInfo(
                            r.getId(),
                            type,
                            r.getId(),
                            r.getTitle(),
                            projectNameMap.getOrDefault(r.getProjectId(), "未知"),
                            r.getCreatedAt()
                    );
                })
                .toList();

        return new DashboardResponse(
                totalProjects,
                totalRecords,
                inProgressRecords,
                pendingReviewRecords,
                recentProjectInfos,
                recentRecordInfos,
                pendingTaskInfos
        );
    }
}

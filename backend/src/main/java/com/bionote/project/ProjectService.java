package com.bionote.project;

import com.bionote.common.api.PageResponse;
import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.project.dto.*;
import com.bionote.project.entity.*;
import com.bionote.security.UserPrincipal;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;

@Service
public class ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectService.class);
    private static final String CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ProjectRepository projectRepository;
    private final MemberRepository memberRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository,
                          MemberRepository memberRepository,
                          ActivityRepository activityRepository,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, UserPrincipal principal) {
        String code = generateProjectCode();
        String description = request.description() != null ? request.description() : "";

        Project project = new Project(code, request.name(), description,
                ProjectStatus.IN_PROGRESS, principal.id());
        project = projectRepository.save(project);

        ProjectMember ownerMember = new ProjectMember(project.getId(), principal.id(),
                ProjectRole.OWNER, MemberStatus.ACTIVE);
        memberRepository.save(ownerMember);

        Activity activity = new Activity(project.getId(), principal.id(), "CREATE",
                "PROJECT", project.getId(), "创建了项目「" + project.getName() + "」");
        activityRepository.save(activity);

        log.info("Project created: id={}, code={}, owner={}", project.getId(), code, principal.username());
        return ProjectResponse.from(project, principal.name());
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目不存在"));
        User owner = userRepository.findById(project.getOwnerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目负责人不存在"));
        return ProjectResponse.from(project, owner.getName());
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> listProjects(ProjectFilter filter) {
        Pageable pageable = PageRequest.of(filter.page(), filter.size(),
                Sort.by("createdAt").descending());

        ProjectStatus status = null;
        if (filter.status() != null && !filter.status().isBlank()) {
            try {
                status = ProjectStatus.valueOf(filter.status().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "无效的项目状态: " + filter.status());
            }
        }

        String keyword = (filter.keyword() != null && !filter.keyword().isBlank())
                ? filter.keyword() : null;
        String ownerId = (filter.ownerId() != null && !filter.ownerId().isBlank())
                ? filter.ownerId() : null;

        Page<Project> page = projectRepository.findFiltered(keyword, status, ownerId, pageable);

        return PageResponse.from(page, project -> {
            User owner = userRepository.findById(project.getOwnerId()).orElse(null);
            String ownerName = owner != null ? owner.getName() : "未知";
            return ProjectResponse.from(project, ownerName);
        });
    }

    @Transactional
    public ProjectResponse updateProject(String id, ProjectUpdateRequest request, UserPrincipal principal) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目不存在"));

        requireProjectPermission(project, principal, "编辑项目");

        project.setName(request.name());
        String description = request.description() != null ? request.description() : "";
        project.setDescription(description);
        project = projectRepository.save(project);

        Activity activity = new Activity(project.getId(), principal.id(), "UPDATE",
                "PROJECT", project.getId(), "更新了项目信息");
        activityRepository.save(activity);

        log.info("Project updated: id={}, by={}", project.getId(), principal.username());
        return ProjectResponse.from(project, principal.name());
    }

    @Transactional
    public ProjectResponse archiveProject(String id, UserPrincipal principal) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目不存在"));

        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION, "项目已归档，无法重复归档");
        }

        if (project.getStatus() == ProjectStatus.IN_PROGRESS) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION,
                    "进行中的项目需要先完成才能归档");
        }

        if (project.getStatus() == ProjectStatus.COMPLETED) {
            // 已完成 → 待复核：提交复核申请
            requireProjectPermission(project, principal, "提交复核");
            project.setStatus(ProjectStatus.PENDING_REVIEW);
            project = projectRepository.save(project);

            Activity activity = new Activity(project.getId(), principal.id(), "SUBMIT_REVIEW",
                    "PROJECT", project.getId(), "提交了项目复核申请");
            activityRepository.save(activity);

            log.info("Project submitted for review: id={}, by={}", project.getId(), principal.username());
        } else {
            // PENDING_REVIEW → ARCHIVED：审核通过并归档
            requireProjectPermission(project, principal, "归档项目");
            project.setStatus(ProjectStatus.ARCHIVED);
            project.setArchivedAt(Instant.now());
            project = projectRepository.save(project);

            Activity activity = new Activity(project.getId(), principal.id(), "ARCHIVE",
                    "PROJECT", project.getId(), "归档了项目");
            activityRepository.save(activity);

            log.info("Project archived: id={}, by={}", project.getId(), principal.username());
        }

        User owner = userRepository.findById(project.getOwnerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目负责人不存在"));
        return ProjectResponse.from(project, owner.getName());
    }

    @Transactional(readOnly = true)
    public List<ProjectActivityResponse> getActivities(String projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目不存在");
        }

        List<Activity> activities = activityRepository.findByProjectIdOrderByCreatedAtDesc(projectId);

        return activities.stream().map(activity -> {
            User actor = userRepository.findById(activity.getActorId()).orElse(null);
            String actorName = actor != null ? actor.getName() : "未知用户";
            return ProjectActivityResponse.from(activity, actorName);
        }).toList();
    }

    private void requireProjectPermission(Project project, UserPrincipal principal, String action) {
        ProjectMember member = memberRepository.findByProjectIdAndUserId(project.getId(), principal.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCESS_DENIED,
                        "您不是该项目成员，无权" + action));
        if (member.getRole() != ProjectRole.OWNER && member.getRole() != ProjectRole.ADMIN) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED,
                    "仅项目负责人和管理员可以" + action);
        }
    }

    private String generateProjectCode() {
        StringBuilder sb = new StringBuilder("PRJ-");
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }
}

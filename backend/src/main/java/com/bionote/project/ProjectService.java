package com.bionote.project;

import com.bionote.common.api.PageResponse;
import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.project.dto.*;
import com.bionote.project.entity.*;
import com.bionote.project.service.ProjectAccessService;
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
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    private final ProjectAccessService accessService;

    public ProjectService(ProjectRepository projectRepository,
                          MemberRepository memberRepository,
                          ActivityRepository activityRepository,
                          UserRepository userRepository,
                          ProjectAccessService accessService) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
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
    public ProjectResponse getProject(String id, String currentUserId) {
        Project project = accessService.requireProject(id);
        accessService.requireCanRead(id, currentUserId);
        User owner = userRepository.findById(project.getOwnerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目负责人不存在"));
        return ProjectResponse.from(project, owner.getName());
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> listProjects(ProjectFilter filter, String currentUserId) {
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

        Page<Project> page = projectRepository.findFilteredForMember(
                currentUserId, keyword, status, ownerId, pageable);
        Map<String, User> owners = loadUsers(page.getContent().stream()
                .map(Project::getOwnerId).toList());
        return PageResponse.from(page, project -> ProjectResponse.from(
                project,
                owners.containsKey(project.getOwnerId())
                        ? owners.get(project.getOwnerId()).getName() : "未知"));
    }

    @Transactional
    public ProjectResponse updateProject(String id, ProjectUpdateRequest request, UserPrincipal principal) {
        Project project = accessService.requireProject(id);
        accessService.requireCanEditProject(id, principal.id());

        if (!project.getVersion().equals(request.version())) {
            throw new BusinessException(ErrorCode.PROJECT_VERSION_CONFLICT,
                    "项目已被其他成员修改，请刷新后重试");
        }

        project.setName(request.name());
        String description = request.description() != null ? request.description() : "";
        project.setDescription(description);
        project = projectRepository.saveAndFlush(project);

        Activity activity = new Activity(project.getId(), principal.id(), "UPDATE",
                "PROJECT", project.getId(), "更新了项目信息");
        activityRepository.save(activity);

        log.info("Project updated: id={}, by={}", project.getId(), principal.username());
        return ProjectResponse.from(project, principal.name());
    }

    @Transactional
    public void archiveProject(String id, UserPrincipal principal) {
        Project project = accessService.requireProject(id);
        accessService.requireCanEditProject(id, principal.id());

        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION, "项目已归档，无法重复归档");
        }
        project.setStatus(ProjectStatus.ARCHIVED);
        project.setArchivedAt(Instant.now());
        projectRepository.saveAndFlush(project);
        activityRepository.save(new Activity(project.getId(), principal.id(), "ARCHIVE",
                "PROJECT", project.getId(), "归档了项目"));
        log.info("Project archived: id={}, by={}", project.getId(), principal.username());
    }

    private String generateProjectCode() {
        StringBuilder sb = new StringBuilder("PRJ-");
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
        }
        return sb.toString();
    }

    private Map<String, User> loadUsers(Collection<String> userIds) {
        return userRepository.findAllById(userIds.stream().distinct().toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }
}

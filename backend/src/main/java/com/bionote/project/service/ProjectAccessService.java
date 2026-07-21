package com.bionote.project.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.project.MemberRepository;
import com.bionote.project.ProjectRepository;
import com.bionote.project.entity.MemberStatus;
import com.bionote.project.entity.Project;
import com.bionote.project.entity.ProjectMember;
import com.bionote.project.entity.ProjectRole;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
public class ProjectAccessService {

    private final ProjectRepository projectRepository;
    private final MemberRepository memberRepository;

    public ProjectAccessService(ProjectRepository projectRepository,
                                MemberRepository memberRepository) {
        this.projectRepository = projectRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional(readOnly = true)
    public Project requireProject(String projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "项目不存在: " + projectId));
    }

    @Transactional(readOnly = true)
    public ProjectMember requireMember(String projectId, String userId) {
        requireProject(projectId);
        return memberRepository.findByProjectIdAndUserId(projectId, userId)
                .filter(member -> member.getMemberStatus() == MemberStatus.ACTIVE)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.ACCESS_DENIED, "您不是该项目的成员"));
    }

    @Transactional(readOnly = true)
    public ProjectRole requireRole(String projectId, String userId) {
        return requireMember(projectId, userId).getRole();
    }

    @Transactional(readOnly = true)
    public void requireAnyOf(String projectId, String userId, ProjectRole... roles) {
        ProjectRole current = requireRole(projectId, userId);
        Set<ProjectRole> allowed = EnumSet.copyOf(java.util.Arrays.asList(roles));
        if (!allowed.contains(current)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "当前角色无权执行该操作");
        }
    }

    @Transactional(readOnly = true)
    public void requireCanRead(String projectId, String userId) {
        requireMember(projectId, userId);
    }

    @Transactional(readOnly = true)
    public void requireCanEditProject(String projectId, String userId) {
        requireAnyOf(projectId, userId, ProjectRole.OWNER);
    }

    @Transactional(readOnly = true)
    public void requireCanManageMembers(String projectId, String userId) {
        requireAnyOf(projectId, userId, ProjectRole.OWNER);
    }

    @Transactional(readOnly = true)
    public void requireCanCreateRecord(String projectId, String userId) {
        requireAnyOf(projectId, userId, ProjectRole.OWNER, ProjectRole.MEMBER);
    }

    @Transactional(readOnly = true)
    public void requireCanEditRecord(String projectId, String userId, String ownerId) {
        ProjectRole role = requireRole(projectId, userId);
        if (role == ProjectRole.OWNER) {
            return;
        }
        if (role == ProjectRole.MEMBER && userId.equals(ownerId)) {
            return;
        }
        throw new BusinessException(ErrorCode.ACCESS_DENIED, "您无权编辑该记录");
    }

    @Transactional(readOnly = true)
    public void requireCanUploadFile(String projectId, String userId) {
        requireAnyOf(projectId, userId, ProjectRole.OWNER, ProjectRole.MEMBER);
    }

    @Transactional(readOnly = true)
    public void requireCanReview(String projectId, String userId) {
        requireAnyOf(projectId, userId, ProjectRole.OWNER, ProjectRole.REVIEWER);
    }

    @Transactional(readOnly = true)
    public void requireCanComment(String projectId, String userId) {
        requireAnyOf(projectId, userId, ProjectRole.OWNER, ProjectRole.MEMBER, ProjectRole.REVIEWER);
    }

    @Transactional(readOnly = true)
    public boolean isMember(String projectId, String userId) {
        return memberRepository.existsByProjectIdAndUserIdAndMemberStatus(
                projectId, userId, MemberStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public List<String> getAccessibleProjectIds(String userId) {
        return memberRepository.findByUserIdAndMemberStatus(userId, MemberStatus.ACTIVE)
                .stream()
                .map(ProjectMember::getProjectId)
                .distinct()
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> getAccessibleProjectIdsByRoles(String userId, Set<ProjectRole> roles) {
        if (roles == null || roles.isEmpty()) {
            return List.of();
        }
        return memberRepository.findByUserIdAndMemberStatusAndRoleIn(
                        userId, MemberStatus.ACTIVE, roles)
                .stream()
                .map(ProjectMember::getProjectId)
                .distinct()
                .toList();
    }
}

package com.bionote.project.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.project.entity.Project;
import com.bionote.project.entity.ProjectMember;
import com.bionote.project.entity.ProjectMemberStatus;
import com.bionote.project.entity.ProjectRole;
import com.bionote.project.repository.ProjectMemberRepository;
import com.bionote.project.repository.ProjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.Set;

@Service
public class ProjectAccessService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;

    public ProjectAccessService(ProjectRepository projectRepository,
                                ProjectMemberRepository memberRepository) {
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
        return memberRepository.findByProjectIdAndUserId(projectId, userId)
                .filter(member -> member.getMemberStatus() == ProjectMemberStatus.ACTIVE)
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
                projectId, userId, ProjectMemberStatus.ACTIVE);
    }
}

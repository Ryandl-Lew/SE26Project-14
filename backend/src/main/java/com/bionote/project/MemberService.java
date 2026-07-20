package com.bionote.project;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.project.dto.*;
import com.bionote.project.entity.*;
import com.bionote.security.UserPrincipal;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MemberService {

    private static final Logger log = LoggerFactory.getLogger(MemberService.class);

    private final MemberRepository memberRepository;
    private final ProjectRepository projectRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    public MemberService(MemberRepository memberRepository,
                         ProjectRepository projectRepository,
                         ActivityRepository activityRepository,
                         UserRepository userRepository) {
        this.memberRepository = memberRepository;
        this.projectRepository = projectRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers(String projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目不存在");
        }

        List<ProjectMember> members = memberRepository.findByProjectId(projectId);

        return members.stream().map(member -> {
            User user = userRepository.findById(member.getUserId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "用户不存在"));
            return MemberResponse.from(member, user);
        }).toList();
    }

    @Transactional
    public MemberResponse addMember(String projectId, MemberRequest request, UserPrincipal principal) {
        if (!projectRepository.existsById(projectId)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目不存在");
        }

        requirePermission(projectId, principal, "添加成员");

        if (memberRepository.existsByProjectIdAndUserId(projectId, request.userId())) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION, "该用户已是项目成员");
        }

        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "用户不存在"));

        ProjectRole role;
        try {
            role = ProjectRole.valueOf(request.role().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "无效的角色: " + request.role());
        }

        if (role == ProjectRole.OWNER) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION, "不能添加其他OWNER角色成员");
        }

        ProjectMember member = new ProjectMember(projectId, request.userId(), role, MemberStatus.ACTIVE);
        member = memberRepository.save(member);

        Activity activity = new Activity(projectId, principal.id(), "ADD_MEMBER",
                "MEMBER", member.getId(), "添加了成员「" + user.getName() + "」，角色为" + role);
        activityRepository.save(activity);

        log.info("Member added: projectId={}, userId={}, role={}, by={}",
                projectId, request.userId(), role, principal.username());
        return MemberResponse.from(member, user);
    }

    @Transactional
    public MemberResponse updateMember(String projectId, String userId,
                                       MemberUpdateRequest request, UserPrincipal principal) {
        if (!projectRepository.existsById(projectId)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目不存在");
        }

        requirePermission(projectId, principal, "修改成员");

        ProjectMember member = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "成员不存在"));

        if (member.getRole() == ProjectRole.OWNER) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "不能修改OWNER角色的成员");
        }

        if (request.role() != null) {
            ProjectRole newRole;
            try {
                newRole = ProjectRole.valueOf(request.role().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "无效的角色: " + request.role());
            }
            if (newRole == ProjectRole.OWNER) {
                throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION, "不能将成员设置为OWNER角色");
            }
            member.setRole(newRole);
        }

        if (request.memberStatus() != null) {
            MemberStatus newStatus;
            try {
                newStatus = MemberStatus.valueOf(request.memberStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                        "无效的成员状态: " + request.memberStatus());
            }
            member.setMemberStatus(newStatus);
        }

        member = memberRepository.save(member);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "用户不存在"));

        Activity activity = new Activity(projectId, principal.id(), "UPDATE_MEMBER",
                "MEMBER", member.getId(), "更新了成员「" + user.getName() + "」的信息");
        activityRepository.save(activity);

        log.info("Member updated: projectId={}, userId={}, by={}",
                projectId, userId, principal.username());
        return MemberResponse.from(member, user);
    }

    @Transactional
    public void removeMember(String projectId, String userId, UserPrincipal principal) {
        if (!projectRepository.existsById(projectId)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "项目不存在");
        }

        requirePermission(projectId, principal, "移除成员");

        ProjectMember member = memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "成员不存在"));

        if (member.getRole() == ProjectRole.OWNER) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "不能移除项目OWNER");
        }

        memberRepository.delete(member);

        User user = userRepository.findById(userId).orElse(null);
        String userName = user != null ? user.getName() : userId;

        Activity activity = new Activity(projectId, principal.id(), "REMOVE_MEMBER",
                "MEMBER", userId, "移除了成员「" + userName + "」");
        activityRepository.save(activity);

        log.info("Member removed: projectId={}, userId={}, by={}",
                projectId, userId, principal.username());
    }

    private void requirePermission(String projectId, UserPrincipal principal, String action) {
        ProjectMember member = memberRepository.findByProjectIdAndUserId(projectId, principal.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCESS_DENIED,
                        "您不是该项目成员，无权" + action));
        if (member.getRole() != ProjectRole.OWNER) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED,
                    "仅项目负责人可以" + action);
        }
    }
}

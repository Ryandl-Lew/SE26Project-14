package com.bionote.project;

import com.bionote.project.entity.MemberStatus;
import com.bionote.project.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface MemberRepository extends JpaRepository<ProjectMember, String> {

    List<ProjectMember> findByProjectId(String projectId);

    List<ProjectMember> findByUserIdAndMemberStatus(String userId, MemberStatus memberStatus);

    List<ProjectMember> findByUserIdAndMemberStatusAndRoleIn(
            String userId,
            MemberStatus memberStatus,
            Set<com.bionote.project.entity.ProjectRole> roles);

    Optional<ProjectMember> findByProjectIdAndUserId(String projectId, String userId);

    boolean existsByProjectIdAndUserId(String projectId, String userId);

    boolean existsByProjectIdAndUserIdAndMemberStatus(
            String projectId, String userId, MemberStatus memberStatus);
}

package com.bionote.project.repository;

import com.bionote.project.entity.ProjectMember;
import com.bionote.project.entity.ProjectMemberStatus;
import com.bionote.project.entity.ProjectRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, String> {

    Optional<ProjectMember> findByProjectIdAndUserId(String projectId, String userId);

    List<ProjectMember> findByProjectIdAndMemberStatus(String projectId, ProjectMemberStatus memberStatus);

    boolean existsByProjectIdAndUserIdAndMemberStatus(String projectId, String userId, ProjectMemberStatus memberStatus);

    List<ProjectMember> findByUserIdAndMemberStatus(String userId, ProjectMemberStatus memberStatus);
}

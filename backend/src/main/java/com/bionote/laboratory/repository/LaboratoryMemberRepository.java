package com.bionote.laboratory.repository;

import com.bionote.laboratory.entity.LaboratoryMember;
import com.bionote.laboratory.entity.LaboratoryMemberStatus;
import com.bionote.laboratory.entity.LaboratoryRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LaboratoryMemberRepository extends JpaRepository<LaboratoryMember, String> {
    @EntityGraph(attributePaths = {"laboratory", "laboratory.leader", "user"})
    Optional<LaboratoryMember> findByLaboratory_IdAndUser_Id(String laboratoryId, String userId);

    @EntityGraph(attributePaths = {"laboratory", "laboratory.leader", "user"})
    Optional<LaboratoryMember> findByLaboratory_IdAndUser_IdAndMemberStatus(
            String laboratoryId,
            String userId,
            LaboratoryMemberStatus status
    );

    @EntityGraph(attributePaths = {"laboratory", "laboratory.leader", "user"})
    Page<LaboratoryMember> findAllByLaboratory_Id(String laboratoryId, Pageable pageable);

    @EntityGraph(attributePaths = {"laboratory", "laboratory.leader", "user"})
    List<LaboratoryMember> findAllByUser_IdAndMemberStatusOrderByJoinedAtDesc(
            String userId,
            LaboratoryMemberStatus status
    );

    boolean existsByUser_IdAndMemberStatus(
            String userId,
            LaboratoryMemberStatus status
    );

    boolean existsByUser_IdAndMemberStatusAndLaboratory_IdNot(
            String userId,
            LaboratoryMemberStatus status,
            String laboratoryId
    );

    long countByLaboratory_IdAndRoleAndMemberStatus(
            String laboratoryId,
            LaboratoryRole role,
            LaboratoryMemberStatus status
    );
}

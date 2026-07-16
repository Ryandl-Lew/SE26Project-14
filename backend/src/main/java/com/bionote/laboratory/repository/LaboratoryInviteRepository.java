package com.bionote.laboratory.repository;

import com.bionote.laboratory.entity.LaboratoryInvite;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.Optional;

public interface LaboratoryInviteRepository extends JpaRepository<LaboratoryInvite, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select invite from LaboratoryInvite invite
            join fetch invite.laboratory
            where invite.codeHash = :codeHash
            """)
    Optional<LaboratoryInvite> findByCodeHashForUpdate(@Param("codeHash") String codeHash);

    @EntityGraph(attributePaths = {"laboratory", "createdBy"})
    Page<LaboratoryInvite> findAllByLaboratory_IdOrderByCreatedAtDesc(
            String laboratoryId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"laboratory", "createdBy"})
    Optional<LaboratoryInvite> findByIdAndLaboratory_Id(String id, String laboratoryId);
}

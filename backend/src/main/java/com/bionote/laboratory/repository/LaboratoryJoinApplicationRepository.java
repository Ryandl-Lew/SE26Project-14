package com.bionote.laboratory.repository;

import com.bionote.laboratory.entity.JoinApplicationStatus;
import com.bionote.laboratory.entity.LaboratoryJoinApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.Optional;

public interface LaboratoryJoinApplicationRepository
        extends JpaRepository<LaboratoryJoinApplication, String> {
    boolean existsByLaboratory_IdAndApplicant_IdAndStatus(
            String laboratoryId,
            String applicantId,
            JoinApplicationStatus status
    );

    @EntityGraph(attributePaths = {"laboratory", "applicant", "reviewedBy"})
    Page<LaboratoryJoinApplication> findAllByApplicant_IdOrderByCreatedAtDesc(
            String applicantId,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {"laboratory", "applicant", "reviewedBy"})
    Page<LaboratoryJoinApplication> findAllByLaboratory_IdAndStatusOrderByCreatedAtAsc(
            String laboratoryId,
            JoinApplicationStatus status,
            Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"laboratory", "laboratory.leader", "applicant", "reviewedBy"})
    @Query("""
            select application from LaboratoryJoinApplication application
            where application.id = :applicationId
              and application.laboratory.id = :laboratoryId
            """)
    Optional<LaboratoryJoinApplication> findByIdAndLaboratoryIdForUpdate(
            @Param("applicationId") String applicationId,
            @Param("laboratoryId") String laboratoryId
    );

    @EntityGraph(attributePaths = {"laboratory", "applicant", "reviewedBy"})
    Optional<LaboratoryJoinApplication> findByIdAndApplicant_Id(
            String applicationId,
            String applicantId
    );
}

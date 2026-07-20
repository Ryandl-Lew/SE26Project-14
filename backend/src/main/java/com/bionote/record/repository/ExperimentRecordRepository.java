package com.bionote.record.repository;

import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExperimentRecordRepository extends JpaRepository<ExperimentRecord, String> {

    Page<ExperimentRecord> findByProjectIdOrderByUpdatedAtDesc(String projectId, Pageable pageable);

    Optional<ExperimentRecord> findByIdAndStatusNot(String id, RecordStatus status);

    @Query("SELECT r FROM ExperimentRecord r WHERE "
            + "(:keyword IS NULL OR r.title LIKE %:keyword% OR r.code LIKE %:keyword%) AND "
            + "(:status IS NULL OR r.status = :status) AND "
            + "(:ownerId IS NULL OR r.ownerId = :ownerId) AND "
            + "(:projectId IS NULL OR r.projectId = :projectId)")
    Page<ExperimentRecord> findFiltered(@Param("keyword") String keyword,
                                        @Param("status") RecordStatus status,
                                        @Param("ownerId") String ownerId,
                                        @Param("projectId") String projectId,
                                        Pageable pageable);

    @Query("SELECT COUNT(r) FROM ExperimentRecord r WHERE r.projectId = :projectId AND r.status = :status")
    long countByProjectIdAndStatus(@Param("projectId") String projectId, @Param("status") RecordStatus status);

    long countByStatusNot(RecordStatus status);

    long countByStatus(RecordStatus status);

    List<ExperimentRecord> findTop5ByStatusNotOrderByUpdatedAtDesc(RecordStatus status);

    @Query("SELECT r FROM ExperimentRecord r WHERE "
            + "(r.status = 'PENDING_REVIEW' AND r.projectId IN "
            + "  (SELECT pm.projectId FROM ProjectMember pm WHERE pm.userId = :userId)) "
            + "OR (r.status = 'REJECTED' AND r.ownerId = :userId)")
    List<ExperimentRecord> findPendingTasks(@Param("userId") String userId);
}

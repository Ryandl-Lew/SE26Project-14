package com.bionote.record.repository;

import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

@Repository
public interface ExperimentRecordRepository extends JpaRepository<ExperimentRecord, String> {

    Optional<ExperimentRecord> findByCode(String code);

    boolean existsByCode(String code);

    Page<ExperimentRecord> findByProjectIdOrderByUpdatedAtDesc(String projectId, Pageable pageable);

    List<ExperimentRecord> findByProjectIdOrderByUpdatedAtDesc(String projectId);

    Page<ExperimentRecord> findByProjectIdAndStatusOrderByUpdatedAtDesc(
            String projectId, RecordStatus status, Pageable pageable);

    Page<ExperimentRecord> findByProjectIdAndOwnerIdOrderByUpdatedAtDesc(
            String projectId, String ownerId, Pageable pageable);

    Page<ExperimentRecord> findByProjectIdAndStatusAndOwnerIdOrderByUpdatedAtDesc(
            String projectId, RecordStatus status, String ownerId, Pageable pageable);

    long countByProjectIdAndStatus(String projectId, RecordStatus status);

    List<ExperimentRecord> findTop5ByProjectIdOrderByUpdatedAtDesc(String projectId);

    long countByProjectIdInAndStatusNot(Collection<String> projectIds, RecordStatus status);

    long countByProjectIdInAndStatus(Collection<String> projectIds, RecordStatus status);

    Page<ExperimentRecord> findByProjectIdInAndStatusNotOrderByUpdatedAtDesc(
            Collection<String> projectIds, RecordStatus status, Pageable pageable);

    Page<ExperimentRecord> findByProjectIdInAndStatusAndOwnerIdNotOrderByUpdatedAtDesc(
            Collection<String> projectIds, RecordStatus status, String ownerId, Pageable pageable);

    Page<ExperimentRecord> findByProjectIdInAndOwnerIdAndStatusInOrderByUpdatedAtDesc(
            Collection<String> projectIds, String ownerId, Collection<RecordStatus> statuses,
            Pageable pageable);

    @Query("""
            SELECT r FROM ExperimentRecord r
            WHERE r.projectId = :projectId
              AND (:status IS NULL OR r.status = :status)
              AND (:ownerId IS NULL OR r.ownerId = :ownerId)
            ORDER BY r.updatedAt DESC
            """)
    Page<ExperimentRecord> searchByProject(
            @Param("projectId") String projectId,
            @Param("status") RecordStatus status,
            @Param("ownerId") String ownerId,
            Pageable pageable);

    @Query("""
            SELECT r FROM ExperimentRecord r
            WHERE r.projectId = :projectId
              AND r.status IN (:statuses)
            ORDER BY r.updatedAt DESC
            """)
    List<ExperimentRecord> findByProjectIdAndStatusIn(
            @Param("projectId") String projectId,
            @Param("statuses") List<RecordStatus> statuses);
}

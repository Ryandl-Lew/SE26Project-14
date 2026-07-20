package com.bionote.file.repository;

import com.bionote.file.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 附件仓储，继承 Spring Data JPA 标准 CRUD 能力。
 * <p>
 * 由于实体类已标注 {@code @SQLRestriction("deleted = false")}，
 * 所有自动生成的查询方法均会自动过滤已软删除的记录。
 * 需要访问已删除记录的场景（软删除列表、恢复）使用原生 SQL 绕过该限制。
 */
@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, String> {

    /** 查询某项目下所有未删除的附件，按创建时间降序。 */
    List<Attachment> findByProjectIdOrderByCreatedAtDesc(String projectId);

    /** 查询某实验记录下所有未删除的附件，按创建时间降序。 */
    List<Attachment> findByRecordIdOrderByCreatedAtDesc(String recordId);

    /**
     * 原生查询 — 列出项目下所有附件（含已删除），按创建时间降序。
     * 绕过实体级的 {@code @SQLRestriction("deleted = false")}。
     */
    @Query(value = "SELECT * FROM attachments WHERE project_id = :projectId ORDER BY created_at DESC",
            nativeQuery = true)
    List<Attachment> findAllByProjectIdIncludingDeleted(@Param("projectId") String projectId);

    /**
     * 原生查询 — 列出实验记录下所有附件（含已删除），按创建时间降序。
     * 绕过实体级的 {@code @SQLRestriction("deleted = false")}。
     */
    @Query(value = "SELECT * FROM attachments WHERE record_id = :recordId ORDER BY created_at DESC",
            nativeQuery = true)
    List<Attachment> findAllByRecordIdIncludingDeleted(@Param("recordId") String recordId);

    /**
     * 原生查询 — 按 ID 查找附件（含已删除记录）。
     * 绕过实体级的 {@code @SQLRestriction("deleted = false")}。
     */
    @Query(value = "SELECT * FROM attachments WHERE id = :id", nativeQuery = true)
    Optional<Attachment> findByIdIncludingDeleted(@Param("id") String id);
}

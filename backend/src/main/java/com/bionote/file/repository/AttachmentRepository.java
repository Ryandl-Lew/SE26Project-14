package com.bionote.file.repository;

import com.bionote.file.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 附件仓储，继承 Spring Data JPA 标准 CRUD 能力。
 * <p>
 * 由于实体类已标注 {@code @SQLRestriction("deleted = false")}，
 * 所有自动生成的查询方法均会自动过滤已软删除的记录。
 */
@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, String> {

    /** 查询某项目下所有未删除的附件，按创建时间降序。 */
    List<Attachment> findByProjectIdOrderByCreatedAtDesc(String projectId);

    /** 查询某实验记录下所有未删除的附件，按创建时间降序。 */
    List<Attachment> findByRecordIdOrderByCreatedAtDesc(String recordId);
}

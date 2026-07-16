package com.bionote.file.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * 文件附件实体，对应 {@code attachments} 表。
 *
 * <h3>软删除</h3>
 * 通过 {@code deleted} 字段标记逻辑删除，配合 {@link SQLRestriction @SQLRestriction}
 * 自动过滤已删除记录，业务代码无需在每个查询中手动添加 {@code deleted = false} 条件。
 *
 * <h3>所属关系约束</h3>
 * 数据库层面通过 CHECK 约束保证每条附件要么属于项目（{@code project_id} 有值、
 * {@code record_id} 为空），要么属于实验记录（{@code record_id} 有值、
 * {@code project_id} 为空），二者互斥。
 */
@Entity
@Table(name = "attachments")
@SQLRestriction("deleted = false")
@EntityListeners(AuditingEntityListener.class)
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "project_id", length = 36)
    private String projectId;

    @Column(name = "record_id", length = 36)
    private String recordId;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "storage_key", nullable = false, length = 255)
    private String storageKey;

    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private Long size;

    @Column(name = "uploaded_by", nullable = false, length = 36)
    private String uploadedBy;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Boolean deleted = false;

    // ──────────────────────────────────────────────
    // 构造器
    // ──────────────────────────────────────────────

    protected Attachment() {
        // JPA 要求无参构造器
    }

    /**
     * 创建附件实体。
     *
     * @param projectId    项目 ID（与 recordId 互斥，可为 {@code null}）
     * @param recordId     实验记录 ID（与 projectId 互斥，可为 {@code null}）
     * @param originalName 原始文件名
     * @param storageKey   磁盘存储标识
     * @param mimeType     MIME 类型
     * @param size         文件大小（字节）
     * @param uploadedBy   上传者用户 ID
     */
    public Attachment(String projectId,
                      String recordId,
                      String originalName,
                      String storageKey,
                      String mimeType,
                      Long size,
                      String uploadedBy) {
        this.projectId = projectId;
        this.recordId = recordId;
        this.originalName = originalName;
        this.storageKey = storageKey;
        this.mimeType = mimeType;
        this.size = size;
        this.uploadedBy = uploadedBy;
        this.deleted = false;
    }

    // ──────────────────────────────────────────────
    // Getter
    // ──────────────────────────────────────────────

    public String getId() { return id; }
    public String getProjectId() { return projectId; }
    public String getRecordId() { return recordId; }
    public String getOriginalName() { return originalName; }
    public String getStorageKey() { return storageKey; }
    public String getMimeType() { return mimeType; }
    public Long getSize() { return size; }
    public String getUploadedBy() { return uploadedBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Boolean getDeleted() { return deleted; }

    // ──────────────────────────────────────────────
    // 业务方法
    // ──────────────────────────────────────────────

    /** 标记为软删除。 */
    public void markDeleted() {
        this.deleted = true;
    }

    /** 恢复已软删除的记录。 */
    public void markRestored() {
        this.deleted = false;
    }
}

package com.bionote.record.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "record_versions")
@EntityListeners(AuditingEntityListener.class)
public class RecordVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "record_id", nullable = false, length = 36)
    private String recordId;

    @Column(name = "version_no", nullable = false)
    private Long versionNo;

    @Column(name = "snapshot_json", nullable = false, columnDefinition = "TEXT")
    private String snapshotJson;

    @Column(name = "changed_by", nullable = false, length = 36)
    private String changedBy;

    @Column(name = "change_reason", nullable = false, length = 500)
    private String changeReason;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected RecordVersion() {
    }

    public RecordVersion(String recordId, Long versionNo, String snapshotJson,
                         String changedBy, String changeReason) {
        this.recordId = recordId;
        this.versionNo = versionNo;
        this.snapshotJson = snapshotJson;
        this.changedBy = changedBy;
        this.changeReason = changeReason;
    }

    public String getId() {
        return id;
    }

    public String getRecordId() {
        return recordId;
    }

    public Long getVersionNo() {
        return versionNo;
    }

    public String getSnapshotJson() {
        return snapshotJson;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public String getChangeReason() {
        return changeReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

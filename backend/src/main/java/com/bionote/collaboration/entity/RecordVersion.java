package com.bionote.collaboration.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "record_versions")
public class RecordVersion extends BaseEntity {

    @Column(name = "record_id", nullable = false, length = 36)
    private String recordId;

    @Column(name = "version_no", nullable = false)
    private Long versionNo;

    @Column(name = "snapshot_json", nullable = false, length = 20000)
    private String snapshotJson;

    @Column(name = "changed_by", nullable = false, length = 36)
    private String changedBy;

    @Column(name = "change_reason", nullable = false, length = 500)
    private String changeReason;

    protected RecordVersion() {
    }

    public RecordVersion(String recordId,
                         Long versionNo,
                         String snapshotJson,
                         String changedBy,
                         String changeReason) {
        this.recordId = recordId;
        this.versionNo = versionNo;
        this.snapshotJson = snapshotJson;
        this.changedBy = changedBy;
        this.changeReason = changeReason;
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
}

package com.bionote.collaboration.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.collaboration.dto.VersionResponse;
import com.bionote.collaboration.dto.VersionSnapshotResponse;
import com.bionote.collaboration.entity.RecordVersion;
import com.bionote.collaboration.repository.RecordVersionRepository;
import com.bionote.project.service.ProjectAccessService;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.service.RecordQueryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VersionService {

    private final RecordVersionRepository versionRepository;
    private final RecordQueryService recordQueryService;
    private final ProjectAccessService accessService;

    public VersionService(RecordVersionRepository versionRepository,
                          RecordQueryService recordQueryService,
                          ProjectAccessService accessService) {
        this.versionRepository = versionRepository;
        this.recordQueryService = recordQueryService;
        this.accessService = accessService;
    }

    @Transactional(readOnly = true)
    public List<VersionResponse> listVersions(String recordId, String currentUserId) {
        ExperimentRecord record = recordQueryService.requireRecord(recordId);
        accessService.requireCanRead(record.getProjectId(), currentUserId);

        return versionRepository.findByRecordIdOrderByVersionNoDesc(recordId)
                .stream()
                .map(VersionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public VersionSnapshotResponse getVersion(String recordId, Long versionNo, String currentUserId) {
        ExperimentRecord record = recordQueryService.requireRecord(recordId);
        accessService.requireCanRead(record.getProjectId(), currentUserId);

        RecordVersion version = versionRepository.findByRecordIdAndVersionNo(recordId, versionNo)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        "版本不存在: recordId=" + recordId + ", versionNo=" + versionNo));
        return VersionSnapshotResponse.from(version);
    }
}
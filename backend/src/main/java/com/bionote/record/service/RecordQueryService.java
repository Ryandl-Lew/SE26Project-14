package com.bionote.record.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.project.service.ProjectAccessService;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import com.bionote.record.repository.ExperimentRecordRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecordQueryService {

    private final ExperimentRecordRepository recordRepository;
    private final ProjectAccessService accessService;

    public RecordQueryService(ExperimentRecordRepository recordRepository,
                              ProjectAccessService accessService) {
        this.recordRepository = recordRepository;
        this.accessService = accessService;
    }

    @Transactional(readOnly = true)
    public ExperimentRecord requireRecord(String recordId) {
        return recordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "实验记录不存在: " + recordId));
    }

    @Transactional(readOnly = true)
    public ExperimentRecord getRecord(String recordId, String currentUserId) {
        ExperimentRecord record = requireRecord(recordId);
        accessService.requireCanRead(record.getProjectId(), currentUserId);
        return record;
    }

    @Transactional(readOnly = true)
    public Page<ExperimentRecord> listRecords(String projectId,
                                               RecordStatus status,
                                               String ownerId,
                                               int page,
                                               int size,
                                               String currentUserId) {
        accessService.requireCanRead(projectId, currentUserId);
        Pageable pageable = PageRequest.of(page, size);
        return recordRepository.searchByProject(projectId, status, ownerId, pageable);
    }
}

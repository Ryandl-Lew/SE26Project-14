package com.bionote.record.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.collaboration.entity.RecordVersion;
import com.bionote.collaboration.entity.Review;
import com.bionote.collaboration.entity.ReviewDecision;
import com.bionote.collaboration.repository.RecordVersionRepository;
import com.bionote.collaboration.repository.ReviewRepository;
import com.bionote.collaboration.service.AuditService;
import com.bionote.project.service.ProjectAccessService;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecordWorkflowService {

    private static final Logger log = LoggerFactory.getLogger(RecordWorkflowService.class);

    private final ExperimentRecordRepository recordRepository;
    private final RecordVersionRepository versionRepository;
    private final ReviewRepository reviewRepository;
    private final RecordQueryService recordQueryService;
    private final ProjectAccessService accessService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public RecordWorkflowService(ExperimentRecordRepository recordRepository,
                                 RecordVersionRepository versionRepository,
                                 ReviewRepository reviewRepository,
                                 RecordQueryService recordQueryService,
                                 ProjectAccessService accessService,
                                 AuditService auditService,
                                 ObjectMapper objectMapper) {
        this.recordRepository = recordRepository;
        this.versionRepository = versionRepository;
        this.reviewRepository = reviewRepository;
        this.recordQueryService = recordQueryService;
        this.accessService = accessService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    /**
     * 从草稿进入进行中。
     */
    @Transactional
    public void startRecord(String recordId, String currentUserId) {
        ExperimentRecord record = recordQueryService.requireRecord(recordId);
        accessService.requireCanEditRecord(record.getProjectId(), currentUserId, record.getOwnerId());
        validateTransition(record, RecordStatus.IN_PROGRESS);

        record.changeStatus(RecordStatus.IN_PROGRESS);
        recordRepository.save(record);
        auditService.logRecord(record.getProjectId(), currentUserId, "START",
                record.getId(), "开始实验: " + record.getTitle());
        log.info("记录开始进行: id={}", recordId);
    }

    /**
     * 提交审核。
     */
    @Transactional
    public void submitRecord(String recordId, String currentUserId) {
        ExperimentRecord record = recordQueryService.requireRecord(recordId);
        accessService.requireCanEditRecord(record.getProjectId(), currentUserId, record.getOwnerId());
        validateTransition(record, RecordStatus.PENDING_REVIEW);

        // 提交前校验内容完整性
        validateContent(record);

        record.changeStatus(RecordStatus.PENDING_REVIEW);
        recordRepository.save(record);

        snapshotVersion(record, currentUserId, "提交审核");

        auditService.logRecord(record.getProjectId(), currentUserId, "SUBMIT",
                record.getId(), "提交审核: " + record.getTitle());
        log.info("记录已提交审核: id={}", recordId);
    }

    /**
     * 审核通过或退回。
     */
    @Transactional
    public void reviewRecord(String recordId,
                              ReviewDecision decision,
                              String reason,
                              Long version,
                              String currentUserId) {
        ExperimentRecord record = recordQueryService.requireRecord(recordId);
        accessService.requireCanReview(record.getProjectId(), currentUserId);

        if (!record.getStatus().canReview()) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION,
                    "当前状态不可审核: " + record.getStatus());
        }

        // 版本校验
        if (!record.getVersion().equals(version)) {
            throw new BusinessException(ErrorCode.RECORD_VERSION_CONFLICT,
                    "数据已被其他成员修改，请刷新后重试");
        }

        // 记录不能自己审核自己
        if (record.getOwnerId().equals(currentUserId)) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "不能审核自己的实验记录");
        }

        RecordStatus nextStatus = (decision == ReviewDecision.APPROVE)
                ? RecordStatus.COMPLETED
                : RecordStatus.REJECTED;

        record.changeStatus(nextStatus);
        recordRepository.save(record);

        // 保存审核记录
        reviewRepository.save(new Review(recordId, currentUserId, decision, reason));

        snapshotVersion(record, currentUserId, decision == ReviewDecision.APPROVE
                ? "审核通过: " + reason : "审核退回: " + reason);

        auditService.logRecord(record.getProjectId(), currentUserId,
                decision == ReviewDecision.APPROVE ? "APPROVE" : "REJECT",
                record.getId(),
                decision == ReviewDecision.APPROVE
                        ? "审核通过: " + record.getTitle()
                        : "审核退回: " + record.getTitle());

        log.info("记录审核完成: id={}, decision={}", recordId, decision);
    }

    /**
     * 归档记录。
     */
    @Transactional
    public void archiveRecord(String recordId, String currentUserId) {
        ExperimentRecord record = recordQueryService.requireRecord(recordId);
        accessService.requireCanEditRecord(record.getProjectId(), currentUserId, record.getOwnerId());

        if (!record.getStatus().canArchive()) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION,
                    "当前状态不可归档: " + record.getStatus());
        }

        record.archive();
        recordRepository.save(record);

        auditService.logRecord(record.getProjectId(), currentUserId, "ARCHIVE",
                record.getId(), "归档记录: " + record.getTitle());
        log.info("记录已归档: id={}", recordId);
    }

    // ──────────────────────────────────────────────
    // 内部方法
    // ──────────────────────────────────────────────

    private void validateTransition(ExperimentRecord record, RecordStatus target) {
        if (!record.getStatus().canTransitionTo(target)) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION,
                    String.format("状态转换非法: %s -> %s", record.getStatus(), target));
        }
    }

    private void validateContent(ExperimentRecord record) {
        if (record.getContentJson() == null || record.getContentJson().isBlank()
                || "{}".equals(record.getContentJson())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "内容不能为空，请填写实验内容后再提交");
        }
    }

    private void snapshotVersion(ExperimentRecord record, String changedBy, String changeReason) {
        try {
            String snapshot = objectMapper.writeValueAsString(
                    com.bionote.record.dto.RecordDetailResponse.from(record));
            versionRepository.save(new RecordVersion(
                    record.getId(), record.getVersion(), snapshot, changedBy, changeReason));
        } catch (Exception e) {
            log.warn("版本快照序列化失败: recordId={}", record.getId());
        }
    }
}
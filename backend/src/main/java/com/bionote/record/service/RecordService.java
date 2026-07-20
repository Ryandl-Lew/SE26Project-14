package com.bionote.record.service;

import com.bionote.common.api.PageResponse;
import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.project.entity.Activity;
import com.bionote.project.ActivityRepository;
import com.bionote.record.dto.*;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import com.bionote.record.entity.RecordVersion;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.bionote.record.repository.RecordVersionRepository;
import com.bionote.security.UserPrincipal;
import com.bionote.user.entity.User;
import com.bionote.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class RecordService {

    private static final Logger log = LoggerFactory.getLogger(RecordService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final ExperimentRecordRepository experimentRecordRepository;
    private final RecordVersionRepository recordVersionRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    public RecordService(ExperimentRecordRepository experimentRecordRepository,
                         RecordVersionRepository recordVersionRepository,
                         ActivityRepository activityRepository,
                         UserRepository userRepository) {
        this.experimentRecordRepository = experimentRecordRepository;
        this.recordVersionRepository = recordVersionRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RecordResponse createRecord(RecordCreateRequest request, UserPrincipal principal) {
        LocalDate experimentDate = LocalDate.parse(request.experimentDate());
        String code = generateCode();

        ExperimentRecord record = new ExperimentRecord(code, request.projectId(),
                request.title(), request.experimentType(), principal.id(), experimentDate);
        if (request.templateId() != null && !request.templateId().isBlank()) {
            record.setTemplateId(request.templateId());
        }
        if (request.location() != null && !request.location().isBlank()) {
            record.setLocation(request.location());
        }
        record.setContentJson("{}");
        record = experimentRecordRepository.save(record);

        RecordVersion version = new RecordVersion(record.getId(), 1L, "{}",
                principal.id(), "创建实验记录");
        recordVersionRepository.save(version);

        activityRepository.save(new Activity(record.getProjectId(),
                principal.id(), "CREATE", "RECORD", record.getId(),
                "创建了实验记录「" + record.getTitle() + "」"));

        log.info("Experiment record created: id={}, code={}, projectId={}, owner={}",
                record.getId(), code, record.getProjectId(), principal.username());
        return RecordResponse.from(record, principal.name());
    }

    @Transactional(readOnly = true)
    public RecordResponse getRecord(String id) {
        ExperimentRecord record = experimentRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "实验记录不存在"));
        User owner = userRepository.findById(record.getOwnerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "记录负责人不存在"));
        return RecordResponse.from(record, owner.getName());
    }

    @Transactional(readOnly = true)
    public PageResponse<RecordResponse> listRecords(RecordFilter filter) {
        Pageable pageable = PageRequest.of(filter.page(), filter.size(),
                Sort.by("updatedAt").descending());

        String keyword = (filter.keyword() != null && !filter.keyword().isBlank())
                ? filter.keyword() : null;

        RecordStatus status = null;
        if (filter.status() != null && !filter.status().isBlank()) {
            try {
                status = RecordStatus.valueOf(filter.status().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "无效的记录状态: " + filter.status());
            }
        }

        String ownerId = (filter.ownerId() != null && !filter.ownerId().isBlank())
                ? filter.ownerId() : null;

        String projectId = (filter.projectId() != null && !filter.projectId().isBlank())
                ? filter.projectId() : null;

        Page<ExperimentRecord> page = experimentRecordRepository.findFiltered(
                keyword, status, ownerId, projectId, pageable);

        return PageResponse.from(page, record -> {
            User owner = userRepository.findById(record.getOwnerId()).orElse(null);
            String ownerName = owner != null ? owner.getName() : "未知";
            return RecordResponse.from(record, ownerName);
        });
    }

    @Transactional
    public RecordResponse updateRecord(String id, RecordUpdateRequest request, UserPrincipal principal) {
        ExperimentRecord record = experimentRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "实验记录不存在"));

        if (!record.getVersion().equals(request.version())) {
            throw new BusinessException(ErrorCode.RECORD_VERSION_CONFLICT, "记录已被修改，请刷新后重试");
        }

        record.setTitle(request.title());
        record.setExperimentType(request.experimentType());
        record.setExperimentDate(request.experimentDate());
        if (request.location() != null) {
            record.setLocation(request.location());
        }
        if (request.content() != null) {
            record.setContentJson(request.content());
        }
        record = experimentRecordRepository.save(record);

        long nextVersionNo = recordVersionRepository
                .findByRecordIdOrderByVersionNoDesc(record.getId())
                .stream()
                .findFirst()
                .map(v -> v.getVersionNo() + 1)
                .orElse(1L);

        recordVersionRepository.save(new RecordVersion(record.getId(), nextVersionNo,
                record.getContentJson(), principal.id(), request.changeReason()));

        activityRepository.save(new Activity(record.getProjectId(),
                principal.id(), "UPDATE", "RECORD", record.getId(),
                "更新了实验记录"));

        log.info("Experiment record updated: id={}, version={}, by={}",
                record.getId(), record.getVersion(), principal.username());
        return RecordResponse.from(record, principal.name());
    }

    @Transactional
    public RecordResponse copyRecord(String id, UserPrincipal principal) {
        ExperimentRecord source = experimentRecordRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "实验记录不存在"));

        String newCode = generateCode();

        ExperimentRecord record = new ExperimentRecord(newCode, source.getProjectId(),
                source.getTitle() + " (副本)", source.getExperimentType(),
                principal.id(), source.getExperimentDate());
        record.setTemplateId(source.getTemplateId());
        record.setLocation(source.getLocation());
        record.setContentJson(source.getContentJson());
        record = experimentRecordRepository.save(record);

        recordVersionRepository.save(new RecordVersion(record.getId(), 1L,
                record.getContentJson(), principal.id(), "复制实验记录"));

        activityRepository.save(new Activity(record.getProjectId(),
                principal.id(), "COPY", "RECORD", record.getId(),
                "复制了实验记录，源记录: " + source.getCode()));

        log.info("Experiment record copied: newId={}, sourceId={}, by={}",
                record.getId(), source.getId(), principal.username());
        return RecordResponse.from(record, principal.name());
    }

    @Transactional(readOnly = true)
    public List<RecordVersionResponse> getVersions(String recordId) {
        if (!experimentRecordRepository.existsById(recordId)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "实验记录不存在");
        }
        return recordVersionRepository.findByRecordIdOrderByVersionNoDesc(recordId)
                .stream()
                .map(RecordVersionResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RecordVersionResponse getVersion(String recordId, Long versionNo) {
        if (!experimentRecordRepository.existsById(recordId)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "实验记录不存在");
        }
        RecordVersion version = recordVersionRepository
                .findByRecordIdAndVersionNo(recordId, versionNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "版本不存在"));
        return RecordVersionResponse.from(version);
    }

    private String generateCode() {
        String datePart = LocalDate.now().format(DATE_FORMAT);
        int randomPart = RANDOM.nextInt(900) + 100;
        return "EXP-" + datePart + "-" + randomPart;
    }
}

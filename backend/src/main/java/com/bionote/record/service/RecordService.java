package com.bionote.record.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.collaboration.entity.RecordVersion;
import com.bionote.collaboration.repository.RecordVersionRepository;
import com.bionote.collaboration.service.AuditService;
import com.bionote.project.service.ProjectAccessService;
import com.bionote.record.dto.CreateRecordRequest;
import com.bionote.record.dto.RecordDetailResponse;
import com.bionote.record.dto.RecordSummaryResponse;
import com.bionote.record.dto.UpdateRecordRequest;
import com.bionote.record.entity.ExperimentRecord;
import com.bionote.record.entity.RecordStatus;
import com.bionote.record.repository.ExperimentRecordRepository;
import com.bionote.template.service.TemplateContentService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Locale;

@Service
public class RecordService {

    private static final Logger log = LoggerFactory.getLogger(RecordService.class);

    private final ExperimentRecordRepository recordRepository;
    private final RecordVersionRepository versionRepository;
    private final RecordCodeGenerator codeGenerator;
    private final ProjectAccessService accessService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;
    private final TemplateContentService templateContentService;

    public RecordService(ExperimentRecordRepository recordRepository,
                         RecordVersionRepository versionRepository,
                         RecordCodeGenerator codeGenerator,
                         ProjectAccessService accessService,
                         AuditService auditService,
                         ObjectMapper objectMapper,
                         TemplateContentService templateContentService) {
        this.recordRepository = recordRepository;
        this.versionRepository = versionRepository;
        this.codeGenerator = codeGenerator;
        this.accessService = accessService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
        this.templateContentService = templateContentService;
    }

    /**
     * 创建空白或基于模板的实验记录。
     */
    @Transactional
    public RecordDetailResponse createRecord(CreateRecordRequest request, String currentUserId) {
        accessService.requireCanCreateRecord(request.projectId(), currentUserId);

        InitialContent initialContent = buildDefaultContent(request.templateId());
        ExperimentRecord record = new ExperimentRecord(
                codeGenerator.nextCode(),
                request.projectId(),
                request.templateId(),
                request.title(),
                request.experimentType(),
                currentUserId,
                request.experimentDate() != null ? request.experimentDate() : LocalDate.now(),
                request.location(),
                initialContent.contentJson(),
                initialContent.templateSnapshotJson()
        );
        ExperimentRecord saved = recordRepository.saveAndFlush(record);

        // 写入初始版本快照
        saveSnapshot(saved, currentUserId, "创建实验记录");

        auditService.logRecord(
                request.projectId(), currentUserId, "CREATE",
                saved.getId(), "创建实验记录: " + saved.getTitle());

        log.info("实验记录已创建: id={}, code={}, projectId={}",
                saved.getId(), saved.getCode(), request.projectId());
        return RecordDetailResponse.from(saved);
    }

    /**
     * 获取记录详情（含权限校验）。
     */
    @Transactional(readOnly = true)
    public RecordDetailResponse getRecord(String recordId, String currentUserId) {
        ExperimentRecord record = findRecord(recordId);
        accessService.requireCanRead(record.getProjectId(), currentUserId);
        return RecordDetailResponse.from(record);
    }

    /**
     * 分页查询记录列表。
     */
    @Transactional(readOnly = true)
    public Page<RecordSummaryResponse> listRecords(String projectId,
                                                    RecordStatus status,
                                                    String ownerId,
                                                    int page,
                                                    int size,
                                                    String currentUserId) {
        accessService.requireCanRead(projectId, currentUserId);
        Page<ExperimentRecord> result = recordRepository.searchByProject(
                projectId, status, ownerId, PageRequest.of(page, size));
        return result.map(RecordSummaryResponse::from);
    }

    /**
     * 更新记录内容（权限 + 版本校验）。
     */
    @Transactional
    public RecordDetailResponse updateRecord(String recordId,
                                              UpdateRecordRequest request,
                                              String currentUserId) {
        ExperimentRecord record = findRecord(recordId);

        // 校验状态是否可编辑
        if (!record.isEditable()) {
            throw new BusinessException(ErrorCode.ILLEGAL_STATE_TRANSITION,
                    "当前状态不可编辑: " + record.getStatus());
        }

        // 校验权限
        accessService.requireCanEditRecord(record.getProjectId(), currentUserId, record.getOwnerId());

        // 版本校验（由 JPA @Version 乐观锁自动处理，此处可提前友好提示）
        if (!record.getVersion().equals(request.version())) {
            throw new BusinessException(ErrorCode.RECORD_VERSION_CONFLICT,
                    "数据已被其他成员修改，请刷新后重试");
        }

        validateContentTypes(record, request.contentJson());
        record.updateContent(
                request.title(),
                request.experimentType(),
                request.experimentDate(),
                request.location(),
                request.contentJson()
        );
        ExperimentRecord saved = recordRepository.saveAndFlush(record);

        // 写入版本快照
        saveSnapshot(saved, currentUserId, request.changeReason());

        auditService.logRecord(
                saved.getProjectId(), currentUserId, "UPDATE",
                saved.getId(), "更新记录: " + saved.getTitle());

        log.info("实验记录已更新: id={}, version={}", saved.getId(), saved.getVersion());
        return RecordDetailResponse.from(saved);
    }

    /**
     * 复制为新的实验记录。
     */
    @Transactional
    public RecordDetailResponse copyRecord(String recordId,
                                            String newTitle,
                                            String currentUserId) {
        ExperimentRecord source = findRecord(recordId);
        accessService.requireCanRead(source.getProjectId(), currentUserId);
        accessService.requireCanCreateRecord(source.getProjectId(), currentUserId);

        ExperimentRecord copy = new ExperimentRecord(
                codeGenerator.nextCode(),
                source.getProjectId(),
                source.getTemplateId(),
                newTitle,
                source.getExperimentType(),
                currentUserId,
                LocalDate.now(),
                source.getLocation(),
                source.getContentJson(),
                source.getTemplateSnapshotJson()
        );
        ExperimentRecord saved = recordRepository.saveAndFlush(copy);

        saveSnapshot(saved, currentUserId, "从 " + source.getCode() + " 复制创建");

        auditService.logRecord(
                saved.getProjectId(), currentUserId, "COPY",
                saved.getId(), "从记录 " + source.getCode() + " 复制创建: " + saved.getTitle());

        log.info("实验记录已复制: source={}, target={}", source.getId(), saved.getId());
        return RecordDetailResponse.from(saved);
    }

    // ──────────────────────────────────────────────
    // 内部方法
    // ──────────────────────────────────────────────

    private ExperimentRecord findRecord(String recordId) {
        return recordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "实验记录不存在: " + recordId));
    }

    private InitialContent buildDefaultContent(String templateId) {
        if (templateId != null && !templateId.isBlank()) {
            TemplateContentService.TemplateContentSnapshot snapshot =
                    templateContentService.createSnapshot(templateId);
            return new InitialContent(snapshot.contentJson(), snapshot.templateSnapshotJson());
        }
        try {
            return new InitialContent(objectMapper.writeValueAsString(Map.of(
                    "purpose", "",
                    "materials", java.util.List.of(),
                    "steps", java.util.List.of(),
                    "parameters", java.util.List.of(),
                    "results", java.util.List.of(),
                    "conclusion", ""
            )), null);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "初始化记录内容失败");
        }
    }

    private void saveSnapshot(ExperimentRecord record, String changedBy, String changeReason) {
        try {
            String snapshot = objectMapper.writeValueAsString(RecordDetailResponse.from(record));
            versionRepository.save(new RecordVersion(
                    record.getId(), record.getVersion(), snapshot, changedBy, changeReason));
        } catch (JsonProcessingException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR,
                    "版本快照保存失败: " + record.getId());
        }
    }

    private void validateContentTypes(ExperimentRecord record, String contentJson) {
        if (contentJson == null) {
            return;
        }
        JsonNode content;
        try {
            content = objectMapper.readTree(contentJson);
        } catch (JsonProcessingException exception) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "实验内容不是合法 JSON",
                    Map.of("contentJson", "必须是合法 JSON"));
        }
        if (!content.isObject()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "实验内容必须是 JSON 对象",
                    Map.of("contentJson", "必须是 JSON 对象"));
        }
        if (record.getTemplateSnapshotJson() == null
                || record.getTemplateSnapshotJson().isBlank()) {
            return;
        }

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        try {
            for (JsonNode field : objectMapper.readTree(record.getTemplateSnapshotJson()).path("fields")) {
                String key = field.path("fieldKey").asText();
                JsonNode value = content.get(key);
                if (value == null || value.isNull()
                        || (value.isTextual() && value.asText().isBlank())) {
                    continue;
                }
                String type = field.path("fieldType").asText().toLowerCase(Locale.ROOT);
                boolean valid = switch (type) {
                    case "table", "image", "sample_picker", "reagent_picker" -> value.isArray();
                    case "number" -> value.isNumber() || isNumericText(value);
                    case "text", "textarea", "date" -> value.isTextual();
                    default -> true;
                };
                if (!valid) {
                    fieldErrors.put(key, field.path("label").asText(key) + "类型不正确");
                }
            }
        } catch (JsonProcessingException exception) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "模板快照解析失败");
        }
        if (!fieldErrors.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "模板字段类型校验失败", fieldErrors);
        }
    }

    private boolean isNumericText(JsonNode value) {
        if (!value.isTextual()) {
            return false;
        }
        try {
            new java.math.BigDecimal(value.asText());
            return true;
        } catch (NumberFormatException exception) {
            return false;
        }
    }

    private record InitialContent(String contentJson, String templateSnapshotJson) {
    }
}

package com.bionote.template.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.template.dto.TemplateFieldResponse;
import com.bionote.template.dto.TemplateListResponse;
import com.bionote.template.dto.TemplateResponse;
import com.bionote.template.dto.CreateTemplateRequest;
import com.bionote.template.dto.UpdateTemplateRequest;
import com.bionote.template.dto.TemplateFieldRequest;
import com.bionote.template.entity.ExperimentTemplate;
import com.bionote.template.entity.TemplateField;
import com.bionote.template.repository.ExperimentTemplateRepository;
import com.bionote.template.repository.TemplateFieldRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@Service
public class TemplateService {
    private final ExperimentTemplateRepository templateRepository;
    private final TemplateFieldRepository fieldRepository;

    public TemplateService(ExperimentTemplateRepository templateRepository,
                           TemplateFieldRepository fieldRepository) {
        this.templateRepository = templateRepository;
        this.fieldRepository = fieldRepository;
    }

    @Transactional(readOnly = true)
    public List<TemplateListResponse> listTemplates(String category) {
        String normalized = category == null ? null : category.trim();
        List<ExperimentTemplate> templates = normalized == null || normalized.isBlank()
                ? templateRepository.findAllByOrderByCategoryAscNameAsc()
                : templateRepository.findByCategoryOrderByName(normalized);
        return templates.stream().map(TemplateListResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public TemplateResponse getTemplate(String id) {
        ExperimentTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "模板不存在: " + id));
        List<TemplateFieldResponse> fields = fieldRepository
                .findByTemplateIdOrderBySortOrder(id).stream()
                .map(TemplateFieldResponse::from).toList();
        return TemplateResponse.from(template, fields);
    }

    @Transactional
    public TemplateResponse createTemplate(CreateTemplateRequest request, String currentUserId) {
        validateFields(request.fields());
        if (templateRepository.existsByName(request.name().trim())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "模板名称已存在",
                    Map.of("name", "模板名称已存在"));
        }
        ExperimentTemplate template = templateRepository.saveAndFlush(new ExperimentTemplate(
                request.name().trim(), request.category().trim(), request.description().trim(),
                false, currentUserId));
        saveFields(template.getId(), request.fields());
        return getTemplate(template.getId());
    }

    @Transactional
    public TemplateResponse updateTemplate(String id,
                                           UpdateTemplateRequest request,
                                           String currentUserId) {
        validateFields(request.fields());
        ExperimentTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "模板不存在: " + id));
        if (Boolean.TRUE.equals(template.getBuiltIn())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "内置模板不能修改");
        }
        if (!currentUserId.equals(template.getCreatedBy())) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "只能修改自己创建的模板");
        }
        if (!template.getVersion().equals(request.version())) {
            throw new BusinessException(ErrorCode.TEMPLATE_VERSION_CONFLICT,
                    "模板已被修改，请刷新后重试");
        }
        templateRepository.findByName(request.name().trim())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessException(ErrorCode.VALIDATION_ERROR, "模板名称已存在",
                            Map.of("name", "模板名称已存在"));
                });
        template.update(request.name().trim(), request.category().trim(),
                request.description().trim());
        templateRepository.saveAndFlush(template);
        fieldRepository.deleteByTemplateId(id);
        fieldRepository.flush();
        saveFields(id, request.fields());
        return getTemplate(id);
    }

    private void saveFields(String templateId, List<TemplateFieldRequest> fields) {
        fieldRepository.saveAllAndFlush(fields.stream()
                .sorted(java.util.Comparator.comparing(TemplateFieldRequest::sortOrder))
                .map(field -> new TemplateField(
                        templateId, field.fieldKey().trim(), field.label().trim(),
                        field.fieldType().trim(), field.required(), field.configJson(),
                        field.sortOrder()))
                .toList());
    }

    private void validateFields(List<TemplateFieldRequest> fields) {
        Set<String> keys = new LinkedHashSet<>();
        Set<Integer> sortOrders = new LinkedHashSet<>();
        for (TemplateFieldRequest field : fields) {
            if (!keys.add(field.fieldKey().trim())) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                        "模板字段 key 不能重复", Map.of("fields", "fieldKey 不能重复"));
            }
            if (!sortOrders.add(field.sortOrder())) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                        "模板字段 sortOrder 不能重复", Map.of("fields", "sortOrder 不能重复"));
            }
        }
    }
}

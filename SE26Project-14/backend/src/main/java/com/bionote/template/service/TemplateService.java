package com.bionote.template.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.template.dto.TemplateCreateRequest;
import com.bionote.template.dto.TemplateFieldResponse;
import com.bionote.template.dto.TemplateListResponse;
import com.bionote.template.dto.TemplateResponse;
import com.bionote.template.dto.TemplateUpdateRequest;
import com.bionote.template.entity.ExperimentTemplate;
import com.bionote.template.entity.TemplateField;
import com.bionote.template.repository.ExperimentTemplateRepository;
import com.bionote.template.repository.TemplateFieldRepository;
import com.bionote.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TemplateService {

    private final ExperimentTemplateRepository experimentTemplateRepository;
    private final TemplateFieldRepository templateFieldRepository;

    public TemplateService(ExperimentTemplateRepository experimentTemplateRepository,
                           TemplateFieldRepository templateFieldRepository) {
        this.experimentTemplateRepository = experimentTemplateRepository;
        this.templateFieldRepository = templateFieldRepository;
    }

    @Transactional(readOnly = true)
    public List<TemplateListResponse> listTemplates(String category) {
        List<ExperimentTemplate> templates;
        if (category == null || category.isBlank()) {
            templates = experimentTemplateRepository.findAll();
        } else {
            templates = experimentTemplateRepository.findByCategoryOrderByName(category);
        }
        return templates.stream()
                .map(t -> TemplateListResponse.from(t, (int) templateFieldRepository.countByTemplateId(t.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public TemplateResponse getTemplate(String id) {
        ExperimentTemplate template = experimentTemplateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "模板不存在"));
        List<TemplateField> fields = templateFieldRepository.findByTemplateIdOrderBySortOrder(id);
        List<TemplateFieldResponse> fieldResponses = fields.stream()
                .map(TemplateFieldResponse::from)
                .toList();
        return TemplateResponse.from(template, fieldResponses);
    }

    @Transactional
    public TemplateResponse createTemplate(TemplateCreateRequest request, UserPrincipal principal) {
        ExperimentTemplate template = new ExperimentTemplate(
                request.name(),
                request.category(),
                request.description() != null ? request.description() : "",
                false,
                principal.id()
        );
        template = experimentTemplateRepository.save(template);
        return TemplateResponse.from(template, List.of());
    }

    @Transactional
    public TemplateResponse updateTemplate(String id, TemplateUpdateRequest request) {
        ExperimentTemplate template = experimentTemplateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "模板不存在"));
        if (template.isBuiltIn()) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "不能修改系统内置模板");
        }
        if (request.name() != null) {
            template.setName(request.name());
        }
        if (request.category() != null) {
            template.setCategory(request.category());
        }
        if (request.description() != null) {
            template.setDescription(request.description());
        }
        template = experimentTemplateRepository.save(template);
        List<TemplateField> fields = templateFieldRepository.findByTemplateIdOrderBySortOrder(id);
        List<TemplateFieldResponse> fieldResponses = fields.stream()
                .map(TemplateFieldResponse::from)
                .toList();
        return TemplateResponse.from(template, fieldResponses);
    }

    @Transactional
    public void deleteTemplate(String id) {
        ExperimentTemplate template = experimentTemplateRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "模板不存在"));
        if (template.isBuiltIn()) {
            throw new BusinessException(ErrorCode.ACCESS_DENIED, "不能删除系统内置模板");
        }
        experimentTemplateRepository.delete(template);
    }
}

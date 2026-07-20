package com.bionote.template.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.template.dto.TemplateFieldResponse;
import com.bionote.template.dto.TemplateListResponse;
import com.bionote.template.dto.TemplateResponse;
import com.bionote.template.entity.ExperimentTemplate;
import com.bionote.template.entity.TemplateField;
import com.bionote.template.repository.ExperimentTemplateRepository;
import com.bionote.template.repository.TemplateFieldRepository;
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
        return templates.stream().map(TemplateListResponse::from).toList();
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
}

package com.bionote.template.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.template.dto.TemplateCreateRequest;
import com.bionote.template.dto.TemplateFieldRequest;
import com.bionote.template.dto.TemplateFieldResponse;
import com.bionote.template.dto.TemplateListResponse;
import com.bionote.template.dto.TemplateResponse;
import com.bionote.template.dto.TemplateUpdateRequest;
import com.bionote.template.entity.ExperimentTemplate;
import com.bionote.template.entity.TemplateCategory;
import com.bionote.template.entity.TemplateField;
import com.bionote.template.entity.UserTemplateFavorite;
import com.bionote.template.repository.ExperimentTemplateRepository;
import com.bionote.template.repository.TemplateFieldRepository;
import com.bionote.template.repository.UserTemplateFavoriteRepository;
import com.bionote.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TemplateService {

    private final ExperimentTemplateRepository experimentTemplateRepository;
    private final TemplateFieldRepository templateFieldRepository;
    private final UserTemplateFavoriteRepository favoriteRepository;

    public TemplateService(ExperimentTemplateRepository experimentTemplateRepository,
                           TemplateFieldRepository templateFieldRepository,
                           UserTemplateFavoriteRepository favoriteRepository) {
        this.experimentTemplateRepository = experimentTemplateRepository;
        this.templateFieldRepository = templateFieldRepository;
        this.favoriteRepository = favoriteRepository;
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
        String category = resolveCategory(request.category());
        ExperimentTemplate template = new ExperimentTemplate(
                request.name(),
                category,
                request.description() != null ? request.description() : "",
                false,
                principal.id()
        );
        template = experimentTemplateRepository.save(template);

        List<TemplateFieldResponse> fieldResponses = List.of();
        if (request.fields() != null && !request.fields().isEmpty()) {
            List<TemplateField> fields = new java.util.ArrayList<>();
            int sort = 1;
            for (TemplateFieldRequest f : request.fields()) {
                fields.add(new TemplateField(
                        template.getId(),
                        f.fieldKey(),
                        f.label(),
                        f.fieldType(),
                        f.required(),
                        f.configJson(),
                        sort++
                ));
            }
            fields = templateFieldRepository.saveAll(fields);
            fieldResponses = fields.stream().map(TemplateFieldResponse::from).toList();
        }

        return TemplateResponse.from(template, fieldResponses);
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
            template.setCategory(resolveCategory(request.category()));
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

    @Transactional
    public void addFavorite(String templateId, UserPrincipal principal) {
        if (!experimentTemplateRepository.existsById(templateId)) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND, "模板不存在");
        }
        if (favoriteRepository.existsByUserIdAndTemplateId(principal.id(), templateId)) {
            return;
        }
        favoriteRepository.save(new UserTemplateFavorite(principal.id(), templateId));
    }

    @Transactional
    public void removeFavorite(String templateId, UserPrincipal principal) {
        favoriteRepository.deleteByUserIdAndTemplateId(principal.id(), templateId);
    }

    @Transactional(readOnly = true)
    public List<String> getFavoriteTemplateIds(UserPrincipal principal) {
        return favoriteRepository.findByUserId(principal.id()).stream()
                .map(UserTemplateFavorite::getTemplateId)
                .toList();
    }

    private String resolveCategory(String category) {
        try {
            return TemplateCategory.valueOf(category.toUpperCase()).name();
        } catch (IllegalArgumentException e) {
            return category.trim();
        }
    }
}

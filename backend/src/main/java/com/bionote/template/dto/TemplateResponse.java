package com.bionote.template.dto;

import com.bionote.template.entity.ExperimentTemplate;

import java.time.Instant;
import java.util.List;

public record TemplateResponse(
        String id, String name, String category, String description,
        boolean builtIn, Long version, String createdBy,
        Instant createdAt, Instant updatedAt, List<TemplateFieldResponse> fields
) {
    public static TemplateResponse from(ExperimentTemplate template,
                                        List<TemplateFieldResponse> fields) {
        return new TemplateResponse(
                template.getId(), template.getName(), template.getCategory(),
                template.getDescription(), Boolean.TRUE.equals(template.getBuiltIn()),
                template.getVersion(), template.getCreatedBy(), template.getCreatedAt(),
                template.getUpdatedAt(), fields);
    }
}

package com.bionote.template.dto;

import com.bionote.template.entity.ExperimentTemplate;

public record TemplateListResponse(
        String id,
        String name,
        String category,
        String description,
        boolean builtIn,
        Long version
) {
    public static TemplateListResponse from(ExperimentTemplate template) {
        return new TemplateListResponse(
                template.getId(),
                template.getName(),
                template.getCategory(),
                template.getDescription(),
                template.isBuiltIn(),
                template.getVersion()
        );
    }
}

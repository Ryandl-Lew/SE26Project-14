package com.bionote.template.dto;

import com.bionote.template.entity.ExperimentTemplate;

public record TemplateListResponse(
        String id,
        String name,
        String category,
        String description,
        String experimentType,
        boolean builtIn,
        Long version,
        int fieldCount
) {
    public static TemplateListResponse from(ExperimentTemplate template, int fieldCount) {
        return new TemplateListResponse(
                template.getId(),
                template.getName(),
                template.getCategory(),
                template.getDescription(),
                template.getCategory(),
                template.isBuiltIn(),
                template.getVersion(),
                fieldCount
        );
    }
}

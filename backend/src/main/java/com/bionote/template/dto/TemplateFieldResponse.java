package com.bionote.template.dto;

import com.bionote.template.entity.TemplateField;

public record TemplateFieldResponse(
        String id,
        String fieldKey,
        String label,
        String fieldType,
        boolean required,
        String configJson,
        int sortOrder
) {
    public static TemplateFieldResponse from(TemplateField field) {
        return new TemplateFieldResponse(
                field.getId(),
                field.getFieldKey(),
                field.getLabel(),
                field.getFieldType(),
                field.isRequired(),
                field.getConfigJson(),
                field.getSortOrder()
        );
    }
}

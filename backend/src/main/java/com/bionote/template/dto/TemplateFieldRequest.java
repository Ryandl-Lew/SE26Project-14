package com.bionote.template.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TemplateFieldRequest(
        @NotBlank @Size(max = 100) String fieldKey,
        @NotBlank @Size(max = 200) String label,
        @NotBlank @Size(max = 32) String fieldType,
        @NotNull Boolean required,
        @Size(max = 2000) String configJson,
        @NotNull @Min(0) Integer sortOrder
) {
}

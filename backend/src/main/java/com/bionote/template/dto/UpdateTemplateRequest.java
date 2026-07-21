package com.bionote.template.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateTemplateRequest(
        @NotNull Long version,
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 64) String category,
        @NotBlank @Size(max = 2000) String description,
        @NotEmpty List<@Valid TemplateFieldRequest> fields
) {
}

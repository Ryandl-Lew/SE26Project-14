package com.bionote.template.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "template_fields")
public class TemplateField extends BaseEntity {

    @Column(name = "template_id", nullable = false, length = 36)
    private String templateId;

    @Column(name = "field_key", nullable = false, length = 100)
    private String fieldKey;

    @Column(nullable = false, length = 200)
    private String label;

    @Column(name = "field_type", nullable = false, length = 32)
    private String fieldType;

    @Column(nullable = false)
    private Boolean required;

    @Column(name = "config_json", length = 2000)
    private String configJson;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    protected TemplateField() {
    }

    public TemplateField(String templateId, String fieldKey, String label,
                         String fieldType, boolean required, int sortOrder) {
        this(templateId, fieldKey, label, fieldType, required, null, sortOrder);
    }

    public TemplateField(String templateId, String fieldKey, String label,
                         String fieldType, boolean required, String configJson, int sortOrder) {
        this.templateId = templateId;
        this.fieldKey = fieldKey;
        this.label = label;
        this.fieldType = fieldType;
        this.required = required;
        this.configJson = configJson;
        this.sortOrder = sortOrder;
    }

    public String getTemplateId() { return templateId; }
    public String getFieldKey() { return fieldKey; }
    public String getLabel() { return label; }
    public String getFieldType() { return fieldType; }
    public Boolean getRequired() { return required; }
    public String getConfigJson() { return configJson; }
    public Integer getSortOrder() { return sortOrder; }
}

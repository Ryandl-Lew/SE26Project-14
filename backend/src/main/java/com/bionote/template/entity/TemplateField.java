package com.bionote.template.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "template_fields")
public class TemplateField {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "template_id", nullable = false, length = 36)
    private String templateId;

    @Column(name = "field_key", nullable = false, length = 100)
    private String fieldKey;

    @Column(nullable = false, length = 200)
    private String label;

    @Column(name = "field_type", nullable = false, length = 50)
    private String fieldType;

    @Column(nullable = false)
    private boolean required;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    protected TemplateField() {
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

    public TemplateField(String id, String templateId, String fieldKey, String label,
                         String fieldType, boolean required, String configJson, int sortOrder) {
        this.id = id;
        this.templateId = templateId;
        this.fieldKey = fieldKey;
        this.label = label;
        this.fieldType = fieldType;
        this.required = required;
        this.configJson = configJson;
        this.sortOrder = sortOrder;
    }

    public String getId() {
        return id;
    }

    public String getTemplateId() {
        return templateId;
    }

    public String getFieldKey() {
        return fieldKey;
    }

    public String getLabel() {
        return label;
    }

    public String getFieldType() {
        return fieldType;
    }

    public boolean isRequired() {
        return required;
    }

    public String getConfigJson() {
        return configJson;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public void setFieldKey(String fieldKey) {
        this.fieldKey = fieldKey;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public void setFieldType(String fieldType) {
        this.fieldType = fieldType;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }

    public void setConfigJson(String configJson) {
        this.configJson = configJson;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}

package com.bionote.template.service;

import com.bionote.common.error.BusinessException;
import com.bionote.common.error.ErrorCode;
import com.bionote.template.entity.ExperimentTemplate;
import com.bionote.template.entity.TemplateField;
import com.bionote.template.repository.ExperimentTemplateRepository;
import com.bionote.template.repository.TemplateFieldRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class TemplateContentService {
    private final ExperimentTemplateRepository templateRepository;
    private final TemplateFieldRepository fieldRepository;
    private final ObjectMapper objectMapper;

    public TemplateContentService(ExperimentTemplateRepository templateRepository,
                                  TemplateFieldRepository fieldRepository,
                                  ObjectMapper objectMapper) {
        this.templateRepository = templateRepository;
        this.fieldRepository = fieldRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public TemplateContentSnapshot createSnapshot(String templateId) {
        ExperimentTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new BusinessException(
                        ErrorCode.RESOURCE_NOT_FOUND, "模板不存在: " + templateId));
        List<TemplateField> fields = fieldRepository.findByTemplateIdOrderBySortOrder(templateId);

        ObjectNode content = objectMapper.createObjectNode();
        ObjectNode snapshot = objectMapper.createObjectNode();
        snapshot.put("schemaVersion", 1);
        snapshot.put("templateId", template.getId());
        snapshot.put("templateName", template.getName());
        snapshot.put("templateVersion", template.getVersion());
        ArrayNode snapshotFields = snapshot.putArray("fields");

        for (TemplateField field : fields) {
            String type = field.getFieldType().toLowerCase(Locale.ROOT);
            if (type.equals("table") || type.equals("image") || type.endsWith("_picker")) {
                content.putArray(field.getFieldKey());
            } else {
                content.put(field.getFieldKey(), "");
            }

            ObjectNode fieldNode = snapshotFields.addObject();
            fieldNode.put("fieldKey", field.getFieldKey());
            fieldNode.put("label", field.getLabel());
            fieldNode.put("fieldType", field.getFieldType());
            fieldNode.put("required", Boolean.TRUE.equals(field.getRequired()));
            fieldNode.put("sortOrder", field.getSortOrder());
            if (field.getConfigJson() != null) {
                fieldNode.put("configJson", field.getConfigJson());
            }
        }
        return new TemplateContentSnapshot(content.toString(), snapshot.toString());
    }

    public record TemplateContentSnapshot(String contentJson, String templateSnapshotJson) {
    }
}

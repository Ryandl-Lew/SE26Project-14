package com.bionote.template.repository;

import com.bionote.template.entity.TemplateField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateFieldRepository extends JpaRepository<TemplateField, String> {

    List<TemplateField> findByTemplateIdOrderBySortOrder(String templateId);
}

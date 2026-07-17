package com.bionote.template.repository;

import com.bionote.template.entity.TemplateField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemplateFieldRepository extends JpaRepository<TemplateField, String> {

    List<TemplateField> findByTemplateIdOrderBySortOrder(String templateId);
}
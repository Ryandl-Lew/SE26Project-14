package com.bionote.template.repository;

import com.bionote.template.entity.ExperimentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExperimentTemplateRepository extends JpaRepository<ExperimentTemplate, String> {

    List<ExperimentTemplate> findByBuiltInTrueOrderByName();

    List<ExperimentTemplate> findByCategory(String category);

    List<ExperimentTemplate> findByCategoryOrderByName(String category);
}

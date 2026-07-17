package com.bionote.template.repository;

import com.bionote.template.entity.ExperimentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExperimentTemplateRepository extends JpaRepository<ExperimentTemplate, String> {

    List<ExperimentTemplate> findByCategoryOrderByName(String category);

    List<ExperimentTemplate> findAllByOrderByCategoryAscNameAsc();

    boolean existsByName(String name);
}
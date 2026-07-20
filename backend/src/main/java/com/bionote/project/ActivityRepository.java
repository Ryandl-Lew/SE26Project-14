package com.bionote.project;

import com.bionote.project.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, String> {

    List<Activity> findByProjectIdOrderByCreatedAtDesc(String projectId);

    Page<Activity> findByProjectIdOrderByCreatedAtDesc(String projectId, Pageable pageable);

    List<Activity> findTop10ByProjectIdOrderByCreatedAtDesc(String projectId);
}

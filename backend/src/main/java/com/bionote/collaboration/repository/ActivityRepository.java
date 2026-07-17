package com.bionote.collaboration.repository;

import com.bionote.collaboration.entity.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, String> {

    Page<Activity> findByProjectIdOrderByCreatedAtDesc(String projectId, Pageable pageable);

    List<Activity> findTop10ByProjectIdOrderByCreatedAtDesc(String projectId);
}

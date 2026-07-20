package com.bionote.project;

import com.bionote.project.entity.Project;
import com.bionote.project.entity.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, String> {

    Optional<Project> findByCode(String code);

    boolean existsByCode(String code);

    @Query("SELECT p FROM Project p WHERE "
            + "(:keyword IS NULL OR p.name LIKE %:keyword% OR p.description LIKE %:keyword%) AND "
            + "(:status IS NULL OR p.status = :status) AND "
            + "(:ownerId IS NULL OR p.ownerId = :ownerId)")
    Page<Project> findFiltered(@Param("keyword") String keyword,
                               @Param("status") ProjectStatus status,
                               @Param("ownerId") String ownerId,
                               Pageable pageable);
}

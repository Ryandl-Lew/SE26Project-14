package com.bionote.laboratory.repository;

import com.bionote.laboratory.entity.Laboratory;
import com.bionote.laboratory.entity.LaboratoryStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LaboratoryRepository extends JpaRepository<Laboratory, String> {
    @EntityGraph(attributePaths = {"leader", "createdBy"})
    Optional<Laboratory> findByIdAndStatus(String id, LaboratoryStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"leader", "createdBy"})
    @Query("select laboratory from Laboratory laboratory where laboratory.id = :id")
    Optional<Laboratory> findByIdForUpdate(@Param("id") String id);
}

package com.bionote.collaboration.repository;

import com.bionote.collaboration.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {

    List<Review> findByRecordIdOrderByCreatedAtDesc(String recordId);

    Optional<Review> findFirstByRecordIdOrderByCreatedAtDesc(String recordId);
}

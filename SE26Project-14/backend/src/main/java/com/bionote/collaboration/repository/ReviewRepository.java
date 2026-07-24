package com.bionote.collaboration.repository;

import com.bionote.collaboration.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, String> {

    List<Review> findByRecordIdOrderByCreatedAtDesc(String recordId);
}

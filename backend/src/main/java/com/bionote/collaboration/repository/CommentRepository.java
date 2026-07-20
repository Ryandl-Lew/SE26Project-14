package com.bionote.collaboration.repository;

import com.bionote.collaboration.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {

    List<Comment> findByRecordIdOrderByCreatedAtDesc(String recordId);
}

package com.bionote.collaboration.repository;

import com.bionote.collaboration.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, String> {

    List<Comment> findByRecordIdOrderByCreatedAtAsc(String recordId);
}

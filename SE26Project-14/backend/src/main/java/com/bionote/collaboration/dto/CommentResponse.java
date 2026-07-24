package com.bionote.collaboration.dto;

import com.bionote.collaboration.entity.Comment;

import java.time.Instant;

public record CommentResponse(
        String id,
        String recordId,
        String authorId,
        String authorName,
        String category,
        String content,
        Instant createdAt
) {
    public static CommentResponse from(Comment comment, String authorName) {
        return new CommentResponse(
                comment.getId(),
                comment.getRecordId(),
                comment.getAuthorId(),
                authorName,
                comment.getCategory(),
                comment.getContent(),
                comment.getCreatedAt()
        );
    }
}

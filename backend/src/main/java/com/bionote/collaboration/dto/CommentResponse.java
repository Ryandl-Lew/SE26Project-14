package com.bionote.collaboration.dto;

import com.bionote.collaboration.entity.Comment;
import com.bionote.collaboration.entity.CommentCategory;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Schema(description = "评论响应体")
public record CommentResponse(
        @Schema(description = "评论 ID") String id,
        @Schema(description = "记录 ID") String recordId,
        @Schema(description = "作者 ID") String authorId,
        @Schema(description = "评论分类") CommentCategory category,
        @Schema(description = "评论内容") String content,
        @Schema(description = "创建时间") OffsetDateTime createdAt
) {
    public static CommentResponse from(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getRecordId(),
                comment.getAuthorId(),
                comment.getCategory(),
                comment.getContent(),
                comment.getCreatedAt() != null
                        ? comment.getCreatedAt().atOffset(ZoneOffset.ofHours(8))
                        : null
        );
    }
}
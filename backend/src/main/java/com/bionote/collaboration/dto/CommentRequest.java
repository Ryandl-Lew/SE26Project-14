package com.bionote.collaboration.dto;

import com.bionote.collaboration.entity.CommentCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "添加评论请求")
public record CommentRequest(
        @NotBlank(message = "评论内容不能为空")
        @Schema(description = "评论内容") String content,

        @Schema(description = "评论分类", defaultValue = "COMMENT")
        CommentCategory category
) {
}
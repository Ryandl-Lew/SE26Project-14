package com.bionote.collaboration.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(
        @NotBlank(message = "评论内容不能为空")
        String content,

        @NotBlank(message = "评论分类不能为空")
        String category
) {
}

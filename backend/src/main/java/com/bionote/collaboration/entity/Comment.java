package com.bionote.collaboration.entity;

import com.bionote.common.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "comments")
public class Comment extends BaseEntity {

    @Column(name = "record_id", nullable = false, length = 36)
    private String recordId;

    @Column(name = "author_id", nullable = false, length = 36)
    private String authorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CommentCategory category;

    @Column(nullable = false, length = 4000)
    private String content;

    protected Comment() {
    }

    public Comment(String recordId, String authorId, CommentCategory category, String content) {
        this.recordId = recordId;
        this.authorId = authorId;
        this.category = category;
        this.content = content;
    }

    public String getRecordId() {
        return recordId;
    }

    public String getAuthorId() {
        return authorId;
    }

    public CommentCategory getCategory() {
        return category;
    }

    public String getContent() {
        return content;
    }
}

package com.bionote.collaboration.entity;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "comments")
@EntityListeners(AuditingEntityListener.class)
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false, length = 36)
    private String id;

    @Column(name = "record_id", nullable = false, length = 36)
    private String recordId;

    @Column(name = "author_id", nullable = false, length = 36)
    private String authorId;

    @Column(name = "category", nullable = false, length = 64)
    private String category;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected Comment() {
    }

    public Comment(String recordId, String authorId, String category, String content) {
        this.recordId = recordId;
        this.authorId = authorId;
        this.category = category;
        this.content = content;
    }

    public String getId() {
        return id;
    }

    public String getRecordId() {
        return recordId;
    }

    public String getAuthorId() {
        return authorId;
    }

    public String getCategory() {
        return category;
    }

    public String getContent() {
        return content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

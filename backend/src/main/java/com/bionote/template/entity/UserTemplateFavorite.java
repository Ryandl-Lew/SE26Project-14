package com.bionote.template.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@Table(name = "user_template_favorites")
@EntityListeners(AuditingEntityListener.class)
public class UserTemplateFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "template_id", nullable = false, length = 36)
    private String templateId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected UserTemplateFavorite() {
    }

    public UserTemplateFavorite(String userId, String templateId) {
        this.userId = userId;
        this.templateId = templateId;
    }

    public String getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getTemplateId() {
        return templateId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

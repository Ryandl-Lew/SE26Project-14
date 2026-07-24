-- V6: 用户模板收藏表
CREATE TABLE user_template_favorites (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    template_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_user_template_fav UNIQUE (user_id, template_id),
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_template FOREIGN KEY (template_id) REFERENCES experiment_templates (id) ON DELETE CASCADE
);

CREATE INDEX idx_utf_user_id ON user_template_favorites (user_id);
CREATE INDEX idx_utf_template_id ON user_template_favorites (template_id);

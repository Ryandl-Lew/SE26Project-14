CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    avatar_text VARCHAR(8),
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    archived_at TIMESTAMP(6),
    CONSTRAINT uk_projects_code UNIQUE (code),
    CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE TABLE project_members (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(32) NOT NULL,
    member_status VARCHAR(32) NOT NULL,
    joined_at TIMESTAMP(6) NOT NULL,
    last_active_at TIMESTAMP(6),
    CONSTRAINT uk_project_members_project_user UNIQUE (project_id, user_id),
    CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects (id),
    CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE experiment_templates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    built_in BOOLEAN NOT NULL DEFAULT FALSE,
    version BIGINT NOT NULL DEFAULT 0,
    created_by VARCHAR(36),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_templates_creator FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE template_fields (
    id VARCHAR(36) PRIMARY KEY,
    template_id VARCHAR(36) NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    label VARCHAR(200) NOT NULL,
    field_type VARCHAR(32) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    config_json TEXT,
    sort_order INT NOT NULL,
    CONSTRAINT uk_template_fields_key UNIQUE (template_id, field_key),
    CONSTRAINT fk_template_fields_template FOREIGN KEY (template_id) REFERENCES experiment_templates (id)
);

CREATE TABLE experiment_records (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    project_id VARCHAR(36) NOT NULL,
    template_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    experiment_type VARCHAR(100) NOT NULL,
    status VARCHAR(32) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    experiment_date DATE NOT NULL,
    location VARCHAR(255),
    content_json TEXT NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    archived_at TIMESTAMP(6),
    CONSTRAINT uk_experiment_records_code UNIQUE (code),
    CONSTRAINT fk_records_project FOREIGN KEY (project_id) REFERENCES projects (id),
    CONSTRAINT fk_records_template FOREIGN KEY (template_id) REFERENCES experiment_templates (id),
    CONSTRAINT fk_records_owner FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE INDEX idx_records_project_status_updated
    ON experiment_records (project_id, status, updated_at);

CREATE TABLE record_versions (
    id VARCHAR(36) PRIMARY KEY,
    record_id VARCHAR(36) NOT NULL,
    version_no BIGINT NOT NULL,
    snapshot_json TEXT NOT NULL,
    changed_by VARCHAR(36) NOT NULL,
    change_reason VARCHAR(500) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_record_versions_number UNIQUE (record_id, version_no),
    CONSTRAINT fk_record_versions_record FOREIGN KEY (record_id) REFERENCES experiment_records (id),
    CONSTRAINT fk_record_versions_user FOREIGN KEY (changed_by) REFERENCES users (id)
);

CREATE TABLE attachments (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36),
    record_id VARCHAR(36),
    original_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    uploaded_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_attachments_storage_key UNIQUE (storage_key),
    CONSTRAINT fk_attachments_project FOREIGN KEY (project_id) REFERENCES projects (id),
    CONSTRAINT fk_attachments_record FOREIGN KEY (record_id) REFERENCES experiment_records (id),
    CONSTRAINT fk_attachments_uploader FOREIGN KEY (uploaded_by) REFERENCES users (id),
    CONSTRAINT chk_attachments_single_owner CHECK (
        (project_id IS NOT NULL AND record_id IS NULL)
        OR (project_id IS NULL AND record_id IS NOT NULL)
    )
);

CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    record_id VARCHAR(36) NOT NULL,
    author_id VARCHAR(36) NOT NULL,
    category VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_comments_record FOREIGN KEY (record_id) REFERENCES experiment_records (id),
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users (id)
);

CREATE TABLE reviews (
    id VARCHAR(36) PRIMARY KEY,
    record_id VARCHAR(36) NOT NULL,
    reviewer_id VARCHAR(36) NOT NULL,
    decision VARCHAR(32) NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_reviews_record FOREIGN KEY (record_id) REFERENCES experiment_records (id),
    CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id)
);

CREATE TABLE activities (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    actor_id VARCHAR(36) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(36) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_activities_project FOREIGN KEY (project_id) REFERENCES projects (id),
    CONSTRAINT fk_activities_actor FOREIGN KEY (actor_id) REFERENCES users (id)
);

CREATE INDEX idx_activities_project_created
    ON activities (project_id, created_at);

ALTER TABLE users ADD COLUMN username_normalized VARCHAR(64)
    GENERATED ALWAYS AS (LOWER(TRIM(username)));

ALTER TABLE users ADD COLUMN email_normalized VARCHAR(255)
    GENERATED ALWAYS AS (LOWER(TRIM(email)));

ALTER TABLE users ADD CONSTRAINT chk_users_username_no_at
    CHECK (username NOT LIKE '%@%');

CREATE UNIQUE INDEX uk_users_username_normalized ON users (username_normalized);

CREATE UNIQUE INDEX uk_users_email_normalized ON users (email_normalized);

CREATE TABLE laboratories (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_by VARCHAR(36) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    archived_at TIMESTAMP(6),
    CONSTRAINT uk_laboratories_code UNIQUE (code),
    CONSTRAINT fk_laboratories_creator FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE laboratory_invites (
    id VARCHAR(36) PRIMARY KEY,
    laboratory_id VARCHAR(36) NOT NULL,
    code_hash VARCHAR(64) NOT NULL,
    code_hint VARCHAR(16),
    status VARCHAR(32) NOT NULL,
    expires_at TIMESTAMP(6),
    max_uses INT,
    used_count INT NOT NULL DEFAULT 0,
    created_by VARCHAR(36) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    revoked_at TIMESTAMP(6),
    CONSTRAINT uk_laboratory_invites_code_hash UNIQUE (code_hash),
    CONSTRAINT uk_laboratory_invites_id_laboratory UNIQUE (id, laboratory_id),
    CONSTRAINT fk_laboratory_invites_laboratory
        FOREIGN KEY (laboratory_id) REFERENCES laboratories (id),
    CONSTRAINT fk_laboratory_invites_creator FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT chk_laboratory_invites_used_count CHECK (used_count >= 0),
    CONSTRAINT chk_laboratory_invites_max_uses CHECK (max_uses IS NULL OR max_uses > 0),
    CONSTRAINT chk_laboratory_invites_usage CHECK (max_uses IS NULL OR used_count <= max_uses)
);

CREATE INDEX idx_laboratory_invites_lookup
    ON laboratory_invites (laboratory_id, status, expires_at);

CREATE TABLE laboratory_join_applications (
    id VARCHAR(36) PRIMARY KEY,
    laboratory_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    invite_id VARCHAR(36) NOT NULL,
    origin VARCHAR(32) NOT NULL,
    request_message VARCHAR(500),
    status VARCHAR(32) NOT NULL,
    pending_marker CHAR(1),
    reviewed_by VARCHAR(36),
    reviewed_at TIMESTAMP(6),
    review_reason VARCHAR(1000),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_lab_join_applications_pending
        UNIQUE (laboratory_id, user_id, pending_marker),
    CONSTRAINT fk_lab_join_applications_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_lab_join_applications_invite
        FOREIGN KEY (invite_id, laboratory_id) REFERENCES laboratory_invites (id, laboratory_id),
    CONSTRAINT fk_lab_join_applications_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id),
    CONSTRAINT chk_lab_join_applications_pending_marker CHECK (
        (status = 'PENDING' AND pending_marker = 'P')
        OR (status <> 'PENDING' AND pending_marker IS NULL)
    )
);

CREATE INDEX idx_lab_join_applications_review_queue
    ON laboratory_join_applications (laboratory_id, status, created_at);

CREATE INDEX idx_lab_join_applications_user
    ON laboratory_join_applications (user_id, status, created_at);

CREATE TABLE laboratory_members (
    id VARCHAR(36) PRIMARY KEY,
    laboratory_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    role VARCHAR(32) NOT NULL,
    member_status VARCHAR(32) NOT NULL,
    approved_from_application_id VARCHAR(36),
    joined_at TIMESTAMP(6) NOT NULL,
    left_at TIMESTAMP(6),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_laboratory_members_laboratory_user UNIQUE (laboratory_id, user_id),
    CONSTRAINT uk_laboratory_members_application UNIQUE (approved_from_application_id),
    CONSTRAINT fk_laboratory_members_laboratory
        FOREIGN KEY (laboratory_id) REFERENCES laboratories (id),
    CONSTRAINT fk_laboratory_members_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_laboratory_members_application
        FOREIGN KEY (approved_from_application_id) REFERENCES laboratory_join_applications (id)
);

CREATE INDEX idx_laboratory_members_laboratory
    ON laboratory_members (laboratory_id, member_status, role);

CREATE INDEX idx_laboratory_members_user
    ON laboratory_members (user_id, member_status);

ALTER TABLE projects ADD COLUMN laboratory_id VARCHAR(36);

ALTER TABLE projects ADD CONSTRAINT fk_projects_laboratory
    FOREIGN KEY (laboratory_id) REFERENCES laboratories (id);

CREATE INDEX idx_projects_laboratory_status_updated
    ON projects (laboratory_id, status, updated_at);

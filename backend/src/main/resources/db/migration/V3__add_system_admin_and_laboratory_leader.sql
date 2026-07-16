ALTER TABLE users ADD COLUMN system_role VARCHAR(32) NOT NULL DEFAULT 'USER';

ALTER TABLE laboratories ADD COLUMN leader_id VARCHAR(36);

ALTER TABLE laboratories ADD CONSTRAINT fk_laboratories_leader
    FOREIGN KEY (leader_id) REFERENCES users (id);

CREATE INDEX idx_laboratories_leader_status
    ON laboratories (leader_id, status);

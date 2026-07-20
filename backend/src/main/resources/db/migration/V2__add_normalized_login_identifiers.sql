ALTER TABLE users ADD COLUMN username_normalized VARCHAR(64)
    GENERATED ALWAYS AS (LOWER(TRIM(username)));

ALTER TABLE users ADD COLUMN email_normalized VARCHAR(255)
    GENERATED ALWAYS AS (LOWER(TRIM(email)));

ALTER TABLE users ADD CONSTRAINT chk_users_username_no_at
    CHECK (username NOT LIKE '%@%');

CREATE UNIQUE INDEX uk_users_username_normalized
    ON users (username_normalized);

CREATE UNIQUE INDEX uk_users_email_normalized
    ON users (email_normalized);

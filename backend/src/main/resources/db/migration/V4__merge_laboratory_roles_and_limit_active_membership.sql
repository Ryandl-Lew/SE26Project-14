UPDATE laboratory_members
SET role = 'MENTOR'
WHERE role = 'REVIEWER';

ALTER TABLE laboratory_members ADD COLUMN active_user_id VARCHAR(36)
    GENERATED ALWAYS AS (
        CASE WHEN member_status = 'ACTIVE' THEN user_id ELSE NULL END
    );

CREATE UNIQUE INDEX uk_laboratory_members_active_user
    ON laboratory_members (active_user_id);

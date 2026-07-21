ALTER TABLE experiment_records
    ADD COLUMN template_snapshot_json TEXT;

CREATE INDEX idx_project_members_user_status_project
    ON project_members (user_id, member_status, project_id);

CREATE INDEX idx_records_project_owner_status_updated
    ON experiment_records (project_id, owner_id, status, updated_at);

CREATE INDEX idx_attachments_project_created
    ON attachments (project_id, created_at);

CREATE INDEX idx_attachments_record_created
    ON attachments (record_id, created_at);

CREATE INDEX idx_templates_category_name
    ON experiment_templates (category, name);

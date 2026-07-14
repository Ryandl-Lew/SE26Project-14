-- 为支持 Mock 开发模式，暂时移除 attachments 表的外键约束。
-- 当前前端项目/记录使用 mock 数据，对应的 project_id、record_id
-- 以及 Controller 中硬编码的 mock-user-id 在后端数据库中不存在，
-- 外键约束会阻止文件上传。
--
-- 待认证模块接入、项目 API 就绪后，可通过 V3 迁移恢复外键。

ALTER TABLE attachments
    DROP FOREIGN KEY fk_attachments_project;

ALTER TABLE attachments
    DROP FOREIGN KEY fk_attachments_record;

ALTER TABLE attachments
    DROP FOREIGN KEY fk_attachments_uploader;

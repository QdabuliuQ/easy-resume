-- 简历分享：已有库执行一次
-- npx wrangler d1 execute easy-resume --local --file=./migrations/0001_share.sql
-- npx wrangler d1 execute easy-resume --remote --file=./migrations/0001_share.sql

ALTER TABLE resume_header ADD COLUMN share_token TEXT;
ALTER TABLE resume_header ADD COLUMN share_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE resume_header ADD COLUMN share_expires_at INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS idx_resume_header_share_token ON resume_header(share_token);

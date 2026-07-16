-- 青松简历 D1 schema（仅 3 张业务表）
-- 建表：见 README 命令

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  github_id TEXT NOT NULL UNIQUE,
  username TEXT,
  avatar TEXT,
  email TEXT,
  create_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS resume_header (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  update_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resume_module (
  id TEXT PRIMARY KEY NOT NULL,
  resume_id TEXT NOT NULL,
  module_type TEXT NOT NULL,
  module_json TEXT NOT NULL,
  FOREIGN KEY (resume_id) REFERENCES resume_header(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_resume_header_user_id ON resume_header(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_module_resume_id ON resume_module(resume_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resume_module_resume_type ON resume_module(resume_id, module_type);

-- Executar uma única vez, após backup do Supabase. Não altera o schema public.
BEGIN;
CREATE SCHEMA catarse_finance;
REVOKE ALL ON SCHEMA catarse_finance FROM PUBLIC;
    CREATE TABLE catarse_finance.users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','finance')),
      disabled INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE catarse_finance.sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES catarse_finance.users(id),
      csrf TEXT NOT NULL, expires BIGINT NOT NULL
    );
    CREATE TABLE catarse_finance.invites (
      token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, name TEXT NOT NULL,
      expires BIGINT NOT NULL, used INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE catarse_finance.workspaces (
      id TEXT PRIMARY KEY, revision INTEGER NOT NULL, data_json TEXT NOT NULL
    );
    CREATE TABLE catarse_finance.revisions (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, revision INTEGER NOT NULL,
      data_json TEXT NOT NULL, created_at TEXT NOT NULL, actor TEXT NOT NULL,
      UNIQUE(workspace_id, revision)
    );
    CREATE TABLE catarse_finance.audit (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE catarse_finance.ai_usage (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, workspace_id TEXT NOT NULL,
      created_at TEXT NOT NULL, outcome TEXT NOT NULL
    );

CREATE TABLE catarse_finance.rate_limits (id TEXT PRIMARY KEY, n INTEGER NOT NULL, expires BIGINT NOT NULL);

REVOKE ALL ON ALL TABLES IN SCHEMA catarse_finance FROM PUBLIC;
ALTER TABLE catarse_finance.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE catarse_finance.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE catarse_finance.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE catarse_finance.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE catarse_finance.revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE catarse_finance.audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE catarse_finance.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE catarse_finance.rate_limits ENABLE ROW LEVEL SECURITY;
COMMIT;

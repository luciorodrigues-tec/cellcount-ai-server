-- CELLCOUNT — INF-SCALE-001.1B
-- Distributed analysis-session authority for BE/FE-FIX-006.x.
CREATE TABLE IF NOT EXISTS cellcount_analysis_sessions (
  analysis_id uuid PRIMARY KEY,
  user_id varchar(160) NOT NULL,
  idempotency_key varchar(160) NOT NULL,
  status varchar(32) NOT NULL,
  session jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  schema_version integer NOT NULL DEFAULT 1,
  CONSTRAINT cellcount_analysis_sessions_user_idempotency_uq
    UNIQUE (user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS cellcount_analysis_sessions_status_idx
  ON cellcount_analysis_sessions (status);
CREATE INDEX IF NOT EXISTS cellcount_analysis_sessions_updated_at_idx
  ON cellcount_analysis_sessions (updated_at);

CREATE TABLE IF NOT EXISTS cellcount_analysis_jobs (
  job_id uuid PRIMARY KEY,
  analysis_id uuid NOT NULL,
  user_id varchar(160) NOT NULL,
  status varchar(32) NOT NULL,
  payload jsonb NOT NULL,
  attempt integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  available_at timestamptz NOT NULL,
  lease_token varchar(160),
  worker_id varchar(160),
  leased_at timestamptz,
  lease_expires_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  last_error jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  schema_version integer NOT NULL DEFAULT 1,
  CONSTRAINT cellcount_analysis_jobs_analysis_uq UNIQUE (analysis_id)
);
CREATE INDEX IF NOT EXISTS cellcount_analysis_jobs_claim_idx
  ON cellcount_analysis_jobs (status, available_at, created_at);
CREATE INDEX IF NOT EXISTS cellcount_analysis_jobs_lease_idx
  ON cellcount_analysis_jobs (lease_expires_at)
  WHERE status = 'PROCESSING';

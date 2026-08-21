-- INF-SCALE-001.2F.2 — Durable Worker Attribution
ALTER TABLE cellcount_analysis_jobs ADD COLUMN IF NOT EXISTS last_worker_id varchar(160);
ALTER TABLE cellcount_analysis_jobs ADD COLUMN IF NOT EXISTS last_leased_at timestamptz;
ALTER TABLE cellcount_analysis_jobs ADD COLUMN IF NOT EXISTS last_lease_expires_at timestamptz;
ALTER TABLE cellcount_analysis_jobs ADD COLUMN IF NOT EXISTS last_lease_released_at timestamptz;

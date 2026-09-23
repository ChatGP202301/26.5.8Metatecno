-- Apply with: npx wrangler d1 migrations apply metatecno-leads-metadata --remote
CREATE TABLE IF NOT EXISTS leads (
  lead_id TEXT PRIMARY KEY,
  message_id TEXT,
  created_at INTEGER NOT NULL,
  locale TEXT NOT NULL,
  source_path TEXT NOT NULL,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('accepted', 'failed', 'delivered', 'bounced')),
  error_code TEXT,
  purge_after INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_purge_after ON leads(purge_after);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits(expires_at);

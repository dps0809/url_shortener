/**
 * Database migration script.
 * Creates all 10 tables + indexes for the URL shortener.
 * Run with: node lib/migrate.js  (or npx tsx lib/migrate.ts)
 *
 * Tables created in dependency order:
 *   1. users  2. urls  3. click_logs  4. link_health
 *   5. safety_scan  6. qr_codes  7. user_sessions
 *   8. api_usage  9. url_stats  10. audit_logs
 */
import pool from './db';

const MIGRATION_SQL = `

-- Enable UUID extension (for user_sessions PK)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════
-- Table 1: users
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  user_id      BIGSERIAL PRIMARY KEY,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_h   TEXT NOT NULL,
  role         VARCHAR(10) NOT NULL DEFAULT 'user',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- ═══════════════════════════════════════════════════
-- Table 2: urls
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS urls (
  url_id       BIGSERIAL PRIMARY KEY,
  short_code   VARCHAR(10) UNIQUE NOT NULL,
  long_url     TEXT NOT NULL,
  user_id      BIGINT NOT NULL REFERENCES users(user_id),
  created_at   TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  expiry_date  TIMESTAMP,
  max_clicks   INTEGER,
  click_count  INTEGER NOT NULL DEFAULT 0,
  is_deleted   BOOLEAN NOT NULL DEFAULT false,
  deleted_at   TIMESTAMP,
  status       VARCHAR(20) NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at);

-- ═══════════════════════════════════════════════════
-- Table 3: click_logs
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS click_logs (
  click_id     BIGSERIAL PRIMARY KEY,
  url_id       BIGINT NOT NULL REFERENCES urls(url_id),
  clicked_at   TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  ip_address   VARCHAR(45),
  country      VARCHAR(100),
  device       VARCHAR(20),
  referrer     TEXT
);

CREATE INDEX IF NOT EXISTS idx_click_url_id ON click_logs(url_id);
CREATE INDEX IF NOT EXISTS idx_click_time ON click_logs(clicked_at);
CREATE INDEX IF NOT EXISTS idx_click_country ON click_logs(country);

-- ═══════════════════════════════════════════════════
-- Table 4: link_health
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS link_health (
  health_id        BIGSERIAL PRIMARY KEY,
  url_id           BIGINT NOT NULL UNIQUE REFERENCES urls(url_id),
  last_status_code INTEGER,
  failure_count    INTEGER NOT NULL DEFAULT 0,
  last_checked_at  TIMESTAMP,
  is_dead          BOOLEAN NOT NULL DEFAULT false
);

-- ═══════════════════════════════════════════════════
-- Table 5: safety_scan
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS safety_scan (
  scan_id       BIGSERIAL PRIMARY KEY,
  url_id        BIGINT NOT NULL REFERENCES urls(url_id),
  scan_result   VARCHAR(20) NOT NULL,
  scan_provider VARCHAR(100) NOT NULL,
  scanned_at    TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- ═══════════════════════════════════════════════════
-- Table 6: qr_codes
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS qr_codes (
  qr_id         BIGSERIAL PRIMARY KEY,
  url_id        BIGINT NOT NULL UNIQUE REFERENCES urls(url_id),
  qr_image_url  TEXT NOT NULL,
  generated_at  TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- ═══════════════════════════════════════════════════
-- Table 7: user_sessions
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     BIGINT NOT NULL REFERENCES users(user_id),
  created_at  TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  expires_at  TIMESTAMP NOT NULL,
  ip_address  VARCHAR(45)
);

-- ═══════════════════════════════════════════════════
-- Table 8: api_usage
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS api_usage (
  id             BIGSERIAL PRIMARY KEY,
  user_id        BIGINT NOT NULL UNIQUE REFERENCES users(user_id),
  request_count  INTEGER NOT NULL DEFAULT 0,
  last_request   TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- ═══════════════════════════════════════════════════
-- Table 9: url_stats
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS url_stats (
  url_id         BIGINT NOT NULL UNIQUE REFERENCES urls(url_id),
  daily_clicks   INTEGER NOT NULL DEFAULT 0,
  weekly_clicks  INTEGER NOT NULL DEFAULT 0,
  monthly_clicks INTEGER NOT NULL DEFAULT 0,
  last_updated   TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- ═══════════════════════════════════════════════════
-- Table 10: audit_logs
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  admin_id      BIGINT REFERENCES users(user_id), -- Nullable for public/anonymous events
  action        TEXT NOT NULL,                   -- Changed from VARCHAR(100) to handle JSON details
  target_url_id BIGINT,
  created_at    TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Running database migration...');
    await client.query('BEGIN');
    await client.query(MIGRATION_SQL);
    await client.query('COMMIT');
    console.log('✅ Migration completed — all 10 tables created.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

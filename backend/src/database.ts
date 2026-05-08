import Database from "better-sqlite3";
import { config } from "./config.js";

export const database = new Database(config.databasePath);

database.pragma("foreign_keys = ON");
database.pragma("journal_mode = WAL");

export const initializeWebhookSchema = (): void => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS ingest_endpoints (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (user_id, slug)
    );

    CREATE INDEX IF NOT EXISTS idx_ingest_endpoints_user_id
      ON ingest_endpoints (user_id);

    CREATE INDEX IF NOT EXISTS idx_ingest_endpoints_user_active
      ON ingest_endpoints (user_id, is_active);

    CREATE TABLE IF NOT EXISTS webhook_subscriptions (
      id TEXT PRIMARY KEY,
      ingest_endpoint_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      target_url TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (ingest_endpoint_id)
        REFERENCES ingest_endpoints (id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_user_id
      ON webhook_subscriptions (user_id);

    CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_endpoint_active
      ON webhook_subscriptions (ingest_endpoint_id, is_active);

    CREATE TABLE IF NOT EXISTS inbound_events (
      id TEXT PRIMARY KEY,
      ingest_endpoint_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      headers TEXT NOT NULL,
      received_at TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (ingest_endpoint_id)
        REFERENCES ingest_endpoints (id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_inbound_events_user_id
      ON inbound_events (user_id);

    CREATE INDEX IF NOT EXISTS idx_inbound_events_endpoint_id
      ON inbound_events (ingest_endpoint_id);

    CREATE INDEX IF NOT EXISTS idx_inbound_events_received_at
      ON inbound_events (received_at);

    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      inbound_event_id TEXT NOT NULL,
      webhook_subscription_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (
        status IN ('pending', 'in_progress', 'succeeded', 'failed', 'retrying')
      ),
      next_attempt_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (inbound_event_id)
        REFERENCES inbound_events (id)
        ON DELETE CASCADE,
      FOREIGN KEY (webhook_subscription_id)
        REFERENCES webhook_subscriptions (id)
        ON DELETE CASCADE,
      UNIQUE (inbound_event_id, webhook_subscription_id)
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_user_id
      ON webhook_deliveries (user_id);

    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status_next_attempt
      ON webhook_deliveries (status, next_attempt_at);

    CREATE TABLE IF NOT EXISTS webhook_delivery_attempts (
      id TEXT PRIMARY KEY,
      webhook_delivery_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed')),
      target_url TEXT NOT NULL,
      request_headers TEXT NOT NULL,
      request_body TEXT NOT NULL,
      response_status INTEGER,
      response_headers TEXT,
      response_body TEXT,
      error_message TEXT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      FOREIGN KEY (webhook_delivery_id)
        REFERENCES webhook_deliveries (id)
        ON DELETE CASCADE,
      UNIQUE (webhook_delivery_id, attempt_number)
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_delivery_attempts_delivery_id
      ON webhook_delivery_attempts (webhook_delivery_id);

    CREATE INDEX IF NOT EXISTS idx_webhook_delivery_attempts_status
      ON webhook_delivery_attempts (status);
  `);
};

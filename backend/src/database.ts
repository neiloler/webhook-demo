import Database from "better-sqlite3";
import { config } from "./config.js";

export const database = new Database(config.databasePath);

database.pragma("foreign_keys = ON");
database.pragma("journal_mode = WAL");

export const initializeWebhookSchema = (): void => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      webhook_registration_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id
      ON webhook_events (user_id);

    CREATE TABLE IF NOT EXISTS webhook_registrations (
      id TEXT PRIMARY KEY,
      webhook_registration_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (webhook_registration_id)
        REFERENCES webhook_events (webhook_registration_id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_registrations_user_id
      ON webhook_registrations (user_id);

    CREATE INDEX IF NOT EXISTS idx_webhook_registrations_event_id
      ON webhook_registrations (webhook_registration_id);

    CREATE TABLE IF NOT EXISTS webhook_event_occurrences (
      id TEXT PRIMARY KEY,
      webhook_registration_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      headers TEXT NOT NULL,
      received_at TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (webhook_registration_id)
        REFERENCES webhook_events (webhook_registration_id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_event_occurrences_user_id
      ON webhook_event_occurrences (user_id);

    CREATE INDEX IF NOT EXISTS idx_webhook_event_occurrences_event_id
      ON webhook_event_occurrences (webhook_registration_id);

    CREATE INDEX IF NOT EXISTS idx_webhook_event_occurrences_received_at
      ON webhook_event_occurrences (received_at);
  `);
};

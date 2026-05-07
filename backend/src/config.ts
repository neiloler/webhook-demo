import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_PORT = 4000;
const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_CLIENT_ORIGIN = "http://localhost:3000";
const DEFAULT_AUTH_URL = "http://localhost:4000";
const DEFAULT_DATABASE_PATH = "./data/auth.sqlite";

const requiredSecret = (): string => {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET is required in production.");
  }

  return "dev-only-better-auth-secret-change-me";
};

const parseTrustedOrigins = (value: string | undefined): string[] => {
  const origins = value ?? DEFAULT_CLIENT_ORIGIN;

  return origins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const parsePort = (value: string | undefined): number => {
  const port = Number(value ?? DEFAULT_PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
};

const databasePath = resolve(
  process.cwd(),
  process.env.DATABASE_PATH ?? DEFAULT_DATABASE_PATH,
);
mkdirSync(dirname(databasePath), { recursive: true });

export const config = {
  authSecret: requiredSecret(),
  authUrl: process.env.BETTER_AUTH_URL ?? DEFAULT_AUTH_URL,
  clientOrigins: parseTrustedOrigins(process.env.CLIENT_ORIGIN),
  databasePath,
  host: process.env.HOST ?? DEFAULT_HOST,
  port: parsePort(process.env.PORT),
};

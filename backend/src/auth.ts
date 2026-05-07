import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { config } from "./config.js";

export const auth = betterAuth({
  appName: "Webhook Demo",
  baseURL: config.authUrl,
  database: new Database(config.databasePath),
  emailAndPassword: {
    enabled: true,
  },
  secret: config.authSecret,
  trustedOrigins: config.clientOrigins,
});

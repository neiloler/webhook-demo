"use client";

import { createAuthClient } from "better-auth/react";

export const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export const authClient = createAuthClient({
  baseURL: `${backendUrl}/api/auth`,
});

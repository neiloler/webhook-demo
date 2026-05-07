"use client";

import { useMemo, useState, type SyntheticEvent } from "react";
import { authClient, backendUrl } from "@/lib/auth-client";

type AuthMode = "sign-up" | "sign-in";

type MeResponse = {
  authenticated: boolean;
  session?: unknown;
  user?: {
    email?: string;
    id?: string;
    name?: string;
  };
};

type BackendCheck =
  | {
      state: "idle";
      message: string;
    }
  | {
      state: "authenticated" | "unauthenticated" | "unreachable" | "error";
      message: string;
      details?: unknown;
    };

type AuthMessage = {
  kind: "error" | "success";
  text: string;
} | null;

const initialCheck: BackendCheck = {
  state: "idle",
  message: "Not checked",
};

function statusClass(state: BackendCheck["state"]) {
  if (state === "authenticated") {
    return "badge badgeSuccess";
  }

  if (state === "unauthenticated") {
    return "badge badgeWarning";
  }

  if (state === "unreachable" || state === "error") {
    return "badge badgeDanger";
  }

  return "badge badgeNeutral";
}

function formatDetails(value: unknown) {
  if (!value) {
    return null;
  }

  return JSON.stringify(value, null, 2);
}

export default function Home() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const [message, setMessage] = useState<AuthMessage>(null);
  const [backendCheck, setBackendCheck] = useState<BackendCheck>(initialCheck);
  const [isSubmitting, setIsSubmitting] = useState<AuthMode | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  const sessionDetails = useMemo(() => formatDetails(session), [session]);
  const backendDetails = useMemo(
    () =>
      formatDetails("details" in backendCheck ? backendCheck.details : null),
    [backendCheck],
  );

  async function handleAuthSubmit(
    event: SyntheticEvent<HTMLFormElement>,
    mode: AuthMode,
  ) {
    event.preventDefault();
    const form = event.currentTarget;

    setMessage(null);
    setIsSubmitting(mode);

    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "Local User");

    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({ email, name, password })
        : await authClient.signIn.email({ email, password });

    setIsSubmitting(null);

    if (result.error) {
      setMessage({
        kind: "error",
        text: result.error.message ?? "Authentication failed.",
      });
      return;
    }

    form.reset();
    setMessage({
      kind: "success",
      text: mode === "sign-up" ? "Signed up." : "Signed in.",
    });
    await refetch();
  }

  async function handleSignOut() {
    setMessage(null);
    setIsSubmitting(null);

    const result = await authClient.signOut();

    if (result.error) {
      setMessage({
        kind: "error",
        text: result.error.message ?? "Sign out failed.",
      });
      return;
    }

    setMessage({
      kind: "success",
      text: "Signed out.",
    });
    setBackendCheck(initialCheck);
    await refetch();
  }

  async function checkBackend() {
    setIsCheckingBackend(true);
    setBackendCheck({
      state: "idle",
      message: "Checking",
    });

    try {
      const response = await fetch(`${backendUrl}/api/me`, {
        credentials: "include",
      });

      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (response.ok) {
        const data = body as MeResponse;
        setBackendCheck({
          state: data.authenticated ? "authenticated" : "error",
          message: data.authenticated
            ? "Backend reached with an active session"
            : "Backend reached without an authenticated response",
          details: data,
        });
        return;
      }

      if (response.status === 401) {
        setBackendCheck({
          state: "unauthenticated",
          message: "Backend reached; authentication required",
          details: body,
        });
        return;
      }

      setBackendCheck({
        state: "error",
        message: `Backend returned ${response.status}`,
        details: body,
      });
    } catch (checkError) {
      setBackendCheck({
        state: "unreachable",
        message:
          checkError instanceof Error
            ? checkError.message
            : "Backend request failed",
      });
    } finally {
      setIsCheckingBackend(false);
    }
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <h1>Webhook Demo</h1>
          <p>Frontend on port 3000. Backend target: {backendUrl}</p>
        </div>
        <button
          className="secondary"
          type="button"
          onClick={handleSignOut}
          disabled={!session}
        >
          Sign out
        </button>
      </header>

      <section className="grid">
        <div className="panel">
          <h2>Authentication</h2>
          <div className="forms">
            <form
              className="form"
              onSubmit={(event) => handleAuthSubmit(event, "sign-up")}
            >
              <label>
                Name
                <input
                  name="name"
                  autoComplete="name"
                  defaultValue="Local User"
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <button type="submit" disabled={isSubmitting !== null}>
                {isSubmitting === "sign-up" ? "Signing up" : "Sign up"}
              </button>
            </form>

            <form
              className="form"
              onSubmit={(event) => handleAuthSubmit(event, "sign-in")}
            >
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  required
                />
              </label>
              <button type="submit" disabled={isSubmitting !== null}>
                {isSubmitting === "sign-in" ? "Signing in" : "Sign in"}
              </button>
            </form>
          </div>
          <p
            className={message?.kind === "error" ? "message error" : "message"}
          >
            {message?.text}
          </p>
        </div>

        <aside className="panel">
          <h2>Status</h2>
          <ul className="statusList">
            <li className="statusRow">
              <span className="badge badgeSuccess">Running</span>
              <span>Frontend</span>
            </li>
            <li className="statusRow">
              <span className={statusClass(backendCheck.state)}>
                {backendCheck.state}
              </span>
              <span>{backendCheck.message}</span>
            </li>
            <li className="statusRow">
              <span
                className={
                  session ? "badge badgeSuccess" : "badge badgeNeutral"
                }
              >
                {isPending ? "Loading" : session ? "Signed in" : "Signed out"}
              </span>
              <span>{session?.user?.email ?? "No active session"}</span>
            </li>
          </ul>

          <div className="actions">
            <button
              type="button"
              onClick={checkBackend}
              disabled={isCheckingBackend}
            >
              {isCheckingBackend ? "Checking" : "Check backend"}
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => refetch()}
            >
              Refresh session
            </button>
          </div>

          {error ? <p className="message error">{error.message}</p> : null}
          {backendDetails ? <pre>{backendDetails}</pre> : null}
          {sessionDetails ? (
            <pre>{sessionDetails}</pre>
          ) : (
            <p className="muted">Session: none</p>
          )}
        </aside>
      </section>
    </main>
  );
}

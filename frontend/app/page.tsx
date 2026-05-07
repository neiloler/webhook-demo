"use client";

import { useMemo, useState, type SyntheticEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LabeledInput } from "@/components/labeled-input";
import { authClient, backendUrl } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

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

const statusBadgeClass = (state: BackendCheck["state"]): string => {
  if (state === "authenticated") {
    return "bg-primary text-primary-foreground";
  }

  if (state === "unauthenticated") {
    return "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200";
  }

  if (state === "unreachable" || state === "error") {
    return "bg-destructive/10 text-destructive dark:bg-destructive/20";
  }

  return "bg-secondary text-secondary-foreground";
};

const formatDetails = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  return JSON.stringify(value, null, 2);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isMeResponse = (value: unknown): value is MeResponse => {
  if (!isRecord(value) || typeof value.authenticated !== "boolean") {
    return false;
  }

  if (value.user !== undefined && !isRecord(value.user)) {
    return false;
  }

  return true;
};

const Home = () => {
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

  const handleAuthSubmit = async (
    event: SyntheticEvent<HTMLFormElement>,
    mode: AuthMode,
  ) => {
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
  };

  const handleSignOut = async () => {
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
  };

  const checkBackend = async () => {
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
        if (!isMeResponse(body)) {
          setBackendCheck({
            state: "error",
            message: "Backend returned an unexpected response",
            details: body,
          });
          return;
        }

        setBackendCheck({
          state: body.authenticated ? "authenticated" : "error",
          message: body.authenticated
            ? "Backend reached with an active session"
            : "Backend reached without an authenticated response",
          details: body,
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
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl gap-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid gap-1">
            <h1 className="font-heading text-2xl font-medium tracking-normal">
              Webhook Demo
            </h1>
            <p className="text-sm text-muted-foreground">
              Frontend on port 3000. Backend target: {backendUrl}
            </p>
          </div>
          <Button
            variant="outline"
            type="button"
            onClick={handleSignOut}
            disabled={!session}
          >
            Sign out
          </Button>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <form
                  className="grid gap-4"
                  onSubmit={(event) => handleAuthSubmit(event, "sign-up")}
                >
                  <LabeledInput
                    id="sign-up-name"
                    label="Name"
                    name="name"
                    autoComplete="name"
                    defaultValue="Local User"
                    required
                  />
                  <LabeledInput
                    id="sign-up-email"
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                  <LabeledInput
                    id="sign-up-password"
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <Button type="submit" disabled={isSubmitting !== null}>
                    {isSubmitting === "sign-up" ? "Signing up" : "Sign up"}
                  </Button>
                </form>

                <form
                  className="grid content-start gap-4"
                  onSubmit={(event) => handleAuthSubmit(event, "sign-in")}
                >
                  <LabeledInput
                    id="sign-in-email"
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                  <LabeledInput
                    id="sign-in-password"
                    label="Password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    minLength={8}
                    required
                  />
                  <Button type="submit" disabled={isSubmitting !== null}>
                    {isSubmitting === "sign-in" ? "Signing in" : "Sign in"}
                  </Button>
                </form>
              </div>

              <p
                className={cn(
                  "min-h-5 text-sm text-muted-foreground",
                  message?.kind === "error" && "text-destructive",
                )}
              >
                {message?.text}
              </p>
            </CardContent>
          </Card>

          <aside>
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <ul className="grid gap-3">
                  <li className="grid grid-cols-[7.5rem_1fr] items-center gap-3">
                    <Badge className="bg-primary text-primary-foreground">
                      Running
                    </Badge>
                    <span>Frontend</span>
                  </li>
                  <li className="grid grid-cols-[7.5rem_1fr] items-center gap-3">
                    <Badge className={statusBadgeClass(backendCheck.state)}>
                      {backendCheck.state}
                    </Badge>
                    <span>{backendCheck.message}</span>
                  </li>
                  <li className="grid grid-cols-[7.5rem_1fr] items-center gap-3">
                    <Badge
                      className={
                        session
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }
                    >
                      {isPending
                        ? "Loading"
                        : session
                          ? "Signed in"
                          : "Signed out"}
                    </Badge>
                    <span>{session?.user?.email ?? "No active session"}</span>
                  </li>
                </ul>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={checkBackend}
                    disabled={isCheckingBackend}
                  >
                    {isCheckingBackend ? "Checking" : "Check backend"}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => refetch()}
                  >
                    Refresh session
                  </Button>
                </div>

                {error ? (
                  <p className="text-sm text-destructive">{error.message}</p>
                ) : null}
                {backendDetails ? (
                  <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs leading-6 text-foreground whitespace-pre-wrap">
                    {backendDetails}
                  </pre>
                ) : null}
                {sessionDetails ? (
                  <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs leading-6 text-foreground whitespace-pre-wrap">
                    {sessionDetails}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">Session: none</p>
                )}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
};

export default Home;

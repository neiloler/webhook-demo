"use client";

import { Login03Icon, UserAdd02Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { useEffect, useState, type SyntheticEvent } from "react";
import { ActionButton } from "@/components/action-button";
import { LabeledInput } from "@/components/labeled-input";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient, backendUrl } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type AuthMode = "sign-in" | "sign-up";

type AuthMessage = {
  kind: "error" | "success";
  text: string;
} | null;

const LoginPage = () => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [message, setMessage] = useState<AuthMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/");
    }
  }, [isPending, router, session]);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "Local User").trim() || "Local User";

    setMessage(null);
    setIsSubmitting(true);

    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({ email, name, password })
        : await authClient.signIn.email({ email, password });

    setIsSubmitting(false);

    if (result.error) {
      setMessage({
        kind: "error",
        text: result.error.message ?? "Authentication failed.",
      });
      return;
    }

    setMessage({
      kind: "success",
      text: mode === "sign-up" ? "Account created." : "Signed in.",
    });
    router.replace("/");
  };

  return (
    <main className="grid min-h-screen place-items-center bg-muted/20 px-4 py-8 text-foreground">
      <section className="grid w-full max-w-md gap-4">
        <div className="grid gap-1">
          <h1 className="font-heading text-2xl font-medium tracking-normal">
            Webhook Demo
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage ingest endpoints, subscriptions, and delivery recovery.
          </p>
        </div>

        <Card className="rounded-lg" size="sm">
          <CardHeader>
            <CardTitle>{mode === "sign-in" ? "Sign in" : "Create account"}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form className="grid gap-4" onSubmit={handleSubmit}>
              {mode === "sign-up" ? (
                <LabeledInput
                  autoComplete="name"
                  defaultValue="Local User"
                  id="name"
                  label="Name"
                  name="name"
                  required
                />
              ) : null}
              <LabeledInput
                autoComplete="email"
                id="email"
                label="Email"
                name="email"
                required
                type="email"
              />
              <PasswordInput
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                id="password"
                label="Password"
                minLength={8}
                name="password"
                required
              />
              <ActionButton
                disabled={isSubmitting}
                icon={mode === "sign-up" ? UserAdd02Icon : Login03Icon}
                label={mode === "sign-up" ? "Create account" : "Sign in"}
                type="submit"
                variant="default"
              >
                {isSubmitting
                  ? mode === "sign-up"
                    ? "Creating account"
                    : "Signing in"
                  : mode === "sign-up"
                    ? "Create account"
                    : "Sign in"}
              </ActionButton>
            </form>

            <p
              className={cn(
                "min-h-5 text-sm text-muted-foreground",
                message?.kind === "error" && "text-destructive",
                message?.kind === "success" && "text-primary",
              )}
            >
              {message?.text}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-xs text-muted-foreground">Backend: {backendUrl}</p>
              <Button
                onClick={() => {
                  setMessage(null);
                  setMode(mode === "sign-in" ? "sign-up" : "sign-in");
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                {mode === "sign-in" ? "Need an account?" : "Have an account?"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default LoginPage;

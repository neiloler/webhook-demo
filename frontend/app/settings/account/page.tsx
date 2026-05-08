"use client";

import { ArrowLeft02Icon, Key02Icon, Logout03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type SyntheticEvent } from "react";
import { ActionButton } from "@/components/action-button";
import { PasswordInput } from "@/components/password-input";
import { ProtectedScreen } from "@/components/protected-screen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type FormMessage = {
  kind: "error" | "success";
  text: string;
} | null;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "Password change failed.";
};

const AccountSettingsPage = () => {
  return (
    <ProtectedScreen loadingLabel="Loading account">
      {(session) => <AccountSettings userEmail={session.user.email} />}
    </ProtectedScreen>
  );
};

const AccountSettings = ({ userEmail }: { userEmail: string }) => {
  const router = useRouter();
  const [message, setMessage] = useState<FormMessage>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    setMessage(null);

    if (!currentPassword) {
      setMessage({ kind: "error", text: "Current password is required." });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        kind: "error",
        text: "New password must be at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ kind: "error", text: "New passwords do not match." });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      });

      if (result.error) {
        setMessage({
          kind: "error",
          text: result.error.message ?? "Password change failed.",
        });
        return;
      }

      form.reset();
      setMessage({ kind: "success", text: "Password changed." });
    } catch (error) {
      setMessage({ kind: "error", text: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    const result = await authClient.signOut();

    if (result.error) {
      setMessage({
        kind: "error",
        text: result.error.message ?? "Sign out failed.",
      });
      return;
    }

    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <header className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-1">
            <h1 className="font-heading text-2xl font-medium tracking-normal">
              Account Settings
            </h1>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link className="gap-2" href="/">
                <HugeiconsIcon aria-hidden icon={ArrowLeft02Icon} size={16} />
                Dashboard
              </Link>
            </Button>
            <ActionButton icon={Logout03Icon} label="Sign out" onClick={handleSignOut}>
              Sign out
            </ActionButton>
          </nav>
        </header>

        <Card className="rounded-lg" size="sm">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form className="grid w-full max-w-[18rem] gap-4" onSubmit={handleSubmit}>
              <PasswordInput
                autoComplete="current-password"
                id="currentPassword"
                label="Current password"
                name="currentPassword"
                required
              />
              <PasswordInput
                autoComplete="new-password"
                id="newPassword"
                label="New password"
                minLength={8}
                name="newPassword"
                required
              />
              <PasswordInput
                autoComplete="new-password"
                id="confirmPassword"
                label="Confirm new password"
                minLength={8}
                name="confirmPassword"
                required
              />
              <ActionButton
                disabled={isSubmitting}
                icon={Key02Icon}
                label="Change password"
                type="submit"
                variant="default"
              >
                {isSubmitting ? "Changing password" : "Change password"}
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
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AccountSettingsPage;

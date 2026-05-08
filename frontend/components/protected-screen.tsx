"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";

type SessionData = NonNullable<ReturnType<typeof authClient.useSession>["data"]>;

type ProtectedScreenProps = {
  children: (session: SessionData) => ReactNode;
  loadingLabel?: string;
};

const ProtectedScreen = ({
  children,
  loadingLabel = "Loading session",
}: ProtectedScreenProps) => {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, router, session]);

  if (isPending || !session) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
        <div className="grid gap-2 text-center">
          <p className="text-sm font-medium">{loadingLabel}</p>
          <p className="text-xs text-muted-foreground">Resolving your dashboard access.</p>
        </div>
      </main>
    );
  }

  return children(session);
};

export { ProtectedScreen };

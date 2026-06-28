"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!getCurrentUser()) {
        router.replace("/login");
        return;
      }

      setIsReady(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [router]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center text-sm font-medium text-text-500">
        Validando sessao...
      </div>
    );
  }

  return <>{children}</>;
}

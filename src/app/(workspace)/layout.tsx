import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentPrincipal, getVerifiedAuthUserId } from "@/lib/auth";
import {
  isDatabaseConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

async function WorkspaceGate({ children }: { children: ReactNode }) {
  await connection();

  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    if (process.env.NODE_ENV === "development") {
      return <AppShell>{children}</AppShell>;
    }
    redirect("/login?reason=setup");
  }

  const principal = await getCurrentPrincipal();
  if (!principal) {
    if (await getVerifiedAuthUserId()) {
      redirect("/access-pending");
    }
    redirect("/login");
  }

  return (
    <AppShell
      user={{
        displayName: principal.displayName,
        email: principal.email,
        roles: principal.roles,
        permissions: principal.permissions,
      }}
    >
      {children}
    </AppShell>
  );
}

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="app-loading" />}>
      <WorkspaceGate>{children}</WorkspaceGate>
    </Suspense>
  );
}

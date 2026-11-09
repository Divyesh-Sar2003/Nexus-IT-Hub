import "server-only";

import { redirect } from "next/navigation";
import { getCurrentPrincipal } from "@/lib/auth";

export async function requirePermission(permission: string) {
  const principal = await getCurrentPrincipal();

  if (!principal) {
    redirect("/login");
  }

  if (!principal.permissions.includes(permission)) {
    redirect("/forbidden");
  }

  return principal;
}

export async function requireAnyPermission(permissions: string[]) {
  const principal = await getCurrentPrincipal();

  if (!principal) {
    redirect("/login");
  }

  if (!permissions.some((permission) => principal.permissions.includes(permission))) {
    redirect("/forbidden");
  }

  return principal;
}

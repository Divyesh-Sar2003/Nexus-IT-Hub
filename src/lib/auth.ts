import "server-only";

import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WorkspacePrincipal = {
  id: string;
  authUserId: string;
  organizationId: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
};

export const getVerifiedAuthUserId = cache(async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error) {
    if (
      error.name === "AuthSessionMissingError" ||
      error.name === "AuthInvalidJwtError" ||
      error.name === "AuthInvalidTokenResponseError"
    ) {
      return null;
    }
    throw new Error("Unable to verify the current Supabase session.", {
      cause: error,
    });
  }

  return data?.claims.sub ?? null;
});

export const getCurrentPrincipal = cache(
  async (): Promise<WorkspacePrincipal | null> => {
    const authUserId = await getVerifiedAuthUserId();
    if (!authUserId) {
      return null;
    }

    const { db } = await import("@/lib/db");
    const user = await db.user.findUnique({
      where: { authUserId },
      select: {
        id: true,
        authUserId: true,
        organizationId: true,
        email: true,
        displayName: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const userRoles = await db.userRole.findMany({
      where: {
        userId: user.id,
        organizationId: user.organizationId,
        role: { is: { organizationId: user.organizationId } },
      },
      select: {
        role: {
          select: {
            name: true,
            rolePermissions: {
              where: {
                organizationId: user.organizationId,
                permission: { is: { organizationId: user.organizationId } },
              },
              select: { permission: { select: { key: true } } },
            },
          },
        },
      },
    });

    return {
      id: user.id,
      authUserId: user.authUserId,
      organizationId: user.organizationId,
      email: user.email,
      displayName: user.displayName,
      roles: userRoles.map(({ role }) => role.name),
      permissions: [
        ...new Set(
          userRoles.flatMap(({ role }) =>
            role.rolePermissions.map(({ permission }) => permission.key),
          ),
        ),
      ],
    };
  },
);

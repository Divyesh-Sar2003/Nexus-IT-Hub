"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getRequiredEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    getRequiredEnv(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    getRequiredEnv(
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ),
  );
}

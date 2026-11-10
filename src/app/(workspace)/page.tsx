import { Dashboard } from "@/components/dashboard";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { requirePermission } from "@/lib/authorization";

export default async function Home() {
  if (isSupabaseConfigured() && isDatabaseConfigured()) {
    await requirePermission("dashboard.view");
  }

  return <Dashboard />;
}

import { Suspense } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { isDatabaseConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import { SignInForm } from "./sign-in-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<div className="auth-page" aria-busy="true" />}>
      <LoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const nextPath =
    typeof query.next === "string" &&
    query.next.startsWith("/") &&
    !query.next.startsWith("//") &&
    !query.next.includes("\\")
      ? query.next
      : "/";
  const configured = isSupabaseConfigured() && isDatabaseConfigured();

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand-mark"><LockKeyhole size={21} /></div>
        <span className="auth-eyebrow">NEXUS IT HUB</span>
        <h1>Welcome back</h1>
        <p className="auth-description">
          Sign in with your organization account to access your IT workspace.
        </p>
        {!configured && (
          <div className="auth-setup-notice" role="status">
            Authentication is not connected yet. Copy `.env.example` to `.env`,
            configure Supabase and database values, then restart the app.
            <Link href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
              Open Supabase dashboard
            </Link>
          </div>
        )}
        <SignInForm nextPath={nextPath} />
        {query.passwordUpdated === "true" && (
          <p className="auth-success" role="status">
            Your password was updated. Sign in with your new password.
          </p>
        )}
        {query.reason === "setup" && configured && (
          <p className="auth-message" role="alert">
            Workspace authentication could not be initialized. Check the server
            environment and database connection.
          </p>
        )}
        {query.reason === "recovery" && (
          <p className="auth-message" role="alert">
            That recovery link is invalid or expired. Request a new one below.
          </p>
        )}
      </section>
    </main>
  );
}

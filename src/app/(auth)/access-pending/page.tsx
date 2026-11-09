import Link from "next/link";

export default function AccessPendingPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="auth-eyebrow">NEXUS IT HUB</span>
        <h1>Workspace access pending</h1>
        <p className="auth-description">
          Your sign-in is valid, but an organization administrator must activate
          your Nexus account and assign a role before you can enter the workspace.
        </p>
        <Link className="auth-back-link" href="/login">Return to sign in</Link>
      </section>
    </main>
  );
}

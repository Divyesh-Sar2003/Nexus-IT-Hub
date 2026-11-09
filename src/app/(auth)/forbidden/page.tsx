import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="auth-eyebrow">ACCESS RESTRICTED</span>
        <h1>You don&apos;t have permission</h1>
        <p className="auth-description">
          Your account is not authorized to perform this action. Contact your
          organization administrator if you need access.
        </p>
        <Link className="auth-back-link" href="/">Return to workspace</Link>
      </section>
    </main>
  );
}

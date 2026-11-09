"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  requestPasswordResetAction,
  type AuthFormState,
} from "../login/actions";

const initialState: AuthFormState = {};

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="auth-eyebrow">ACCOUNT RECOVERY</span>
        <h1>Reset your password</h1>
        <p className="auth-description">
          Enter your work email and we&apos;ll send a recovery link if an account
          exists.
        </p>
        <form action={action} className="auth-form">
          <label className="auth-field">
            <span>Work email</span>
            <input
              autoComplete="email"
              name="email"
              placeholder="you@company.com"
              required
              type="email"
            />
          </label>
          {state.message && (
            <p
              className={state.success ? "auth-success" : "auth-message"}
              role={state.success ? "status" : "alert"}
            >
              {state.message}
            </p>
          )}
          <button className="auth-submit" disabled={pending} type="submit">
            {pending ? "Sending..." : "Send recovery link"}
          </button>
          <Link className="auth-back-link" href="/login">Back to sign in</Link>
        </form>
      </section>
    </main>
  );
}

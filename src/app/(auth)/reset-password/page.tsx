"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  updatePasswordAction,
  type AuthFormState,
} from "../login/actions";

const initialState: AuthFormState = {};

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(
    updatePasswordAction,
    initialState,
  );

  return (
    <main className="auth-page">
      <section className="auth-card">
        <span className="auth-eyebrow">ACCOUNT RECOVERY</span>
        <h1>Choose a new password</h1>
        <p className="auth-description">
          Use at least 12 characters to keep your account secure.
        </p>
        <form action={action} className="auth-form">
          <label className="auth-field">
            <span>New password</span>
            <input
              autoComplete="new-password"
              minLength={12}
              name="password"
              required
              type="password"
            />
          </label>
          {state.message && (
            <p className="auth-message" role="alert">{state.message}</p>
          )}
          <button className="auth-submit" disabled={pending} type="submit">
            {pending ? "Updating..." : "Update password"}
          </button>
          <Link className="auth-back-link" href="/login">Back to sign in</Link>
        </form>
      </section>
    </main>
  );
}

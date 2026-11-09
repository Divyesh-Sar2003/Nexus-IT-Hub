"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthFormState } from "./actions";

const initialState: AuthFormState = {};

export function SignInForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(signInAction, initialState);

  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={nextPath} />
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
      <label className="auth-field">
        <span>Password</span>
        <input
          autoComplete="current-password"
          name="password"
          placeholder="Enter your password"
          required
          type="password"
        />
      </label>
      {state.message && (
        <p className="auth-message" role="alert">
          {state.message}
        </p>
      )}
      <button className="auth-submit" disabled={pending} type="submit">
        {pending ? "Signing in..." : "Sign in"}
      </button>
      <div className="auth-form-footer">
        <span>Workspace accounts are provisioned by an administrator.</span>
        <Link href="/forgot-password">Forgot password?</Link>
      </div>
    </form>
  );
}

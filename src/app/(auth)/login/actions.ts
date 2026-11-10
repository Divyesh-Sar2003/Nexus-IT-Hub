"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  isDatabaseConfigured,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthFormState = {
  message?: string;
  success?: boolean;
};

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function getSafeNextPath(value: FormDataEntryValue | null) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/";
  }
  return value;
}

export async function signInAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { message: "Enter a valid email address and password." };
  }
  if (!isSupabaseConfigured() || !isDatabaseConfigured()) {
    return {
      message: "Authentication and database settings are not configured. Check your environment file.",
    };
  }

  const supabase = await createSupabaseServerClient({ allowCookieWrites: true });
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { message: "Sign-in failed. Check your credentials and try again." };
  }

  redirect(getSafeNextPath(formData.get("next")));
}

const emailSchema = z.string().trim().email();

export async function requestPasswordResetAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { message: "Enter a valid email address." };
  }
  if (!isSupabaseConfigured() || !process.env.NEXT_PUBLIC_SITE_URL) {
    return {
      message: "Password recovery is not configured. Contact your workspace administrator.",
    };
  }

  const supabase = await createSupabaseServerClient({ allowCookieWrites: true });
  const redirectTo = new URL(
    "/auth/callback?next=/reset-password",
    process.env.NEXT_PUBLIC_SITE_URL,
  );
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: redirectTo.toString(),
  });
  if (error) {
    return {
      message: "We could not send the recovery email. Please try again later.",
    };
  }

  return {
    success: true,
    message: "If an account exists for that email, a recovery link has been sent.",
  };
}

export async function updatePasswordAction(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = z.string().min(12).safeParse(formData.get("password"));
  if (!password.success) {
    return { message: "Use a password with at least 12 characters." };
  }
  if (!isSupabaseConfigured()) {
    return { message: "Supabase is not configured." };
  }

  const supabase = await createSupabaseServerClient({ allowCookieWrites: true });
  const { data, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError) {
    if (
      claimsError.name === "AuthSessionMissingError" ||
      claimsError.name === "AuthInvalidJwtError" ||
      claimsError.name === "AuthInvalidTokenResponseError"
    ) {
      return { message: "This recovery link is invalid or has expired. Request a new one." };
    }
    throw new Error("Unable to verify the password recovery session.", {
      cause: claimsError,
    });
  }
  if (!data?.claims.sub) {
    return { message: "This recovery link is invalid or has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    return { message: "We could not update your password. Request a new recovery link." };
  }

  redirect("/login?passwordUpdated=true");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient({ allowCookieWrites: true });
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error("Unable to sign out of Supabase.", { cause: error });
  }
  redirect("/login");
}

import type { AuthError } from "@supabase/supabase-js";

/**
 * Maps known Supabase Auth error messages to friendly, user-safe copy.
 * Falls back to a generic message so raw backend errors are never leaked.
 */
export function getAuthErrorMessage(error: AuthError | Error | unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message)
      : "";

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please verify your email address before logging in. Check your inbox for the confirmation link.";
  }
  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (normalized.includes("password should be at least")) {
    return "Password is too short. Please use at least 8 characters.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (normalized.includes("token has expired") || normalized.includes("invalid") && normalized.includes("token")) {
    return "This link has expired or is invalid. Please request a new one.";
  }
  if (normalized.includes("network") || normalized.includes("fetch failed")) {
    return "Network error. Please check your connection and try again.";
  }
  if (normalized.includes("same password") || normalized.includes("should be different")) {
    return "New password must be different from your current password.";
  }

  return message
    ? "Something went wrong. Please try again."
    : "An unexpected error occurred. Please try again.";
}

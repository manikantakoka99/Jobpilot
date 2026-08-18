"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  ExtensionTokenServiceError,
  createExtensionToken,
  revokeExtensionToken,
  type ExtensionTokenSummary,
} from "@/services/extension-token-service";

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

class UnauthenticatedError extends Error {}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new UnauthenticatedError();
  return { supabase, user };
}

function toSafeMessage(error: unknown): string {
  if (error instanceof ExtensionTokenServiceError) return error.message;
  if (error instanceof UnauthenticatedError) return "Please sign in again to continue.";
  // Never leak raw Supabase/Postgres error details to the client.
  console.error("[settings/extension]", error);
  return "Something went wrong. Please try again.";
}

/** Returns the raw token exactly once — the client must show it to the user and never persist it beyond this response. */
export async function createExtensionTokenAction(label: string): Promise<ActionResult<{ token: string; summary: ExtensionTokenSummary }>> {
  try {
    const { supabase, user } = await requireUser();
    const created = await createExtensionToken(supabase, user.id, label);

    revalidatePath("/dashboard/settings");

    return { success: true, data: created };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function revokeExtensionTokenAction(id: string): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await requireUser();
    await revokeExtensionToken(supabase, user.id, id);

    revalidatePath("/dashboard/settings");

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

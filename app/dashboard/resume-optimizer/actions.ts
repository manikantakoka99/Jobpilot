"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { AIProviderError } from "@/lib/ai/errors";
import { optimizeResumeSchema, saveResumeVersionSchema } from "@/lib/validations/optimizer";
import {
  ResumeOptimizerServiceError,
  generateOptimizationPreview,
  saveResumeVersion,
  deleteResumeVersion as deleteResumeVersionService,
  type OptimizePreview,
} from "@/services/resume-optimizer-service";

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
  if (error instanceof ResumeOptimizerServiceError || error instanceof AIProviderError) {
    return error.message;
  }
  if (error instanceof UnauthenticatedError) {
    return "Please sign in again to continue.";
  }
  // Never leak raw Supabase/Postgres/provider error details to the client.
  console.error("[resume-optimizer]", error);
  return "Something went wrong. Please try again.";
}

/** Calls the AI provider and returns a preview — does not persist anything. */
export async function optimizeResumeAction(input: unknown): Promise<ActionResult<OptimizePreview>> {
  try {
    const parsed = optimizeResumeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    const preview = await generateOptimizationPreview(supabase, user.id, parsed.data);

    return { success: true, data: preview };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function saveResumeVersionAction(input: unknown): Promise<ActionResult<{ versionId: string }>> {
  try {
    const parsed = saveResumeVersionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    const version = await saveResumeVersion(supabase, user.id, parsed.data);

    revalidatePath("/dashboard/resume-optimizer/versions");

    return { success: true, data: { versionId: version.id } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function deleteResumeVersionAction(versionId: string): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await requireUser();
    await deleteResumeVersionService(supabase, user.id, versionId);

    revalidatePath("/dashboard/resume-optimizer/versions");

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

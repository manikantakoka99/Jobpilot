"use server";

import { createClient } from "@/lib/supabase/server";
import { ResumeServiceError, createResumeSignedUrl } from "@/services/resume-service";
import { ResumeOptimizerServiceError, getResumeVersionById } from "@/services/resume-optimizer-service";
import { CoverLetterServiceError, getCoverLetterById } from "@/services/cover-letter-service";

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
  if (error instanceof ResumeServiceError || error instanceof ResumeOptimizerServiceError || error instanceof CoverLetterServiceError) {
    return error.message;
  }
  if (error instanceof UnauthenticatedError) return "Please sign in again to continue.";
  // Never leak raw Supabase/Postgres error details to the client.
  console.error("[documents]", error);
  return "Something went wrong. Please try again.";
}

/** Thin wrapper around resume-service — Document Hub's "open"/"download" actions for an original resume file. */
export async function getResumeUrlAction(resumeId: string): Promise<ActionResult<{ url: string }>> {
  try {
    const { supabase, user } = await requireUser();
    const url = await createResumeSignedUrl(supabase, user.id, resumeId);
    return { success: true, data: { url } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

/** Thin wrapper around resume-optimizer-service — Document Hub's "copy"/"download" actions for a saved version. */
export async function getResumeVersionContentAction(
  versionId: string,
): Promise<ActionResult<{ content: string; fileName: string }>> {
  try {
    const { supabase, user } = await requireUser();
    const version = await getResumeVersionById(supabase, user.id, versionId);
    if (!version) return { success: false, error: "Resume version not found." };

    return { success: true, data: { content: version.content, fileName: version.resumeFileName } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

/** Thin wrapper around cover-letter-service — Document Hub's "copy"/"download" actions for a saved letter. */
export async function getCoverLetterContentAction(id: string): Promise<ActionResult<{ content: string; jobTitle: string }>> {
  try {
    const { supabase, user } = await requireUser();
    const letter = await getCoverLetterById(supabase, user.id, id);
    if (!letter) return { success: false, error: "Cover letter not found." };

    return { success: true, data: { content: letter.content, jobTitle: letter.job_title } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

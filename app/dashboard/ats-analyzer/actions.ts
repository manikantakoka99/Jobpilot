"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { analyzeResumeSchema } from "@/lib/validations/ats";
import {
  ResumeServiceError,
  uploadResume as uploadResumeService,
  deleteResume as deleteResumeService,
} from "@/services/resume-service";
import {
  AnalysisServiceError,
  createAnalysis,
  deleteAnalysis as deleteAnalysisService,
} from "@/services/analysis-service";

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
  if (error instanceof ResumeServiceError || error instanceof AnalysisServiceError) {
    return error.message;
  }
  if (error instanceof UnauthenticatedError) {
    return "Please sign in again to continue.";
  }
  // Never leak raw Supabase/Postgres/Storage error details to the client.
  console.error("[ats-analyzer]", error);
  return "Something went wrong. Please try again.";
}

/** Uploads a resume (validated + text-extracted server-side) via a <form> FormData submission. */
export async function uploadResumeAction(formData: FormData): Promise<ActionResult<{ resumeId: string }>> {
  try {
    const { supabase, user } = await requireUser();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose a PDF or DOCX file to upload." };
    }

    const resume = await uploadResumeService(supabase, user.id, file);

    revalidatePath("/dashboard/ats-analyzer");
    revalidatePath("/dashboard/ats-analyzer/resumes");

    return { success: true, data: { resumeId: resume.id } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function deleteResumeAction(resumeId: string): Promise<ActionResult<{ storageDeleteFailed: boolean }>> {
  try {
    const { supabase, user } = await requireUser();
    const result = await deleteResumeService(supabase, user.id, resumeId);

    revalidatePath("/dashboard/ats-analyzer");
    revalidatePath("/dashboard/ats-analyzer/resumes");
    revalidatePath("/dashboard/ats-analyzer/history");

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function analyzeResumeAction(input: unknown): Promise<ActionResult<{ analysisId: string }>> {
  try {
    const parsed = analyzeResumeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    const analysis = await createAnalysis(supabase, user.id, parsed.data);

    revalidatePath("/dashboard/ats-analyzer/history");

    return { success: true, data: { analysisId: analysis.id } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function deleteAnalysisAction(analysisId: string): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await requireUser();
    await deleteAnalysisService(supabase, user.id, analysisId);

    revalidatePath("/dashboard/ats-analyzer/history");

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

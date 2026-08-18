"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { AIProviderError } from "@/lib/ai/errors";
import { startInterviewSessionSchema, submitInterviewAnswerSchema } from "@/lib/validations/interview";
import {
  InterviewServiceError,
  createInterviewSession,
  submitInterviewAnswer,
  finishInterviewSession,
  deleteInterviewSession,
  type InterviewSessionDetail,
} from "@/services/interview-service";
import type { InterviewAnswerRow, InterviewSessionRow } from "@/types/database";

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
  if (error instanceof InterviewServiceError || error instanceof AIProviderError) return error.message;
  if (error instanceof UnauthenticatedError) return "Please sign in again to continue.";
  // Never leak raw Supabase/Postgres/provider error details, and never log
  // full resumes/job descriptions/answers — feature label + nothing else.
  console.error("[interview-prep]", error);
  return "Something went wrong. Please try again.";
}

export async function startInterviewSessionAction(input: unknown): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const parsed = startInterviewSessionSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    const detail = await createInterviewSession(supabase, user.id, parsed.data);

    revalidatePath("/dashboard/interview-prep/history");

    return { success: true, data: { sessionId: detail.session.id } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function submitInterviewAnswerAction(input: unknown): Promise<ActionResult<InterviewAnswerRow>> {
  try {
    const parsed = submitInterviewAnswerSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    const answer = await submitInterviewAnswer(supabase, user.id, parsed.data.questionId, parsed.data.answerText);

    return { success: true, data: answer };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function finishInterviewSessionAction(sessionId: string): Promise<ActionResult<InterviewSessionRow>> {
  try {
    const { supabase, user } = await requireUser();
    const session = await finishInterviewSession(supabase, user.id, sessionId);

    revalidatePath(`/dashboard/interview-prep/${sessionId}`);
    revalidatePath("/dashboard/interview-prep/history");

    return { success: true, data: session };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function deleteInterviewSessionAction(sessionId: string): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await requireUser();
    await deleteInterviewSession(supabase, user.id, sessionId);

    revalidatePath("/dashboard/interview-prep/history");

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export type { InterviewSessionDetail };

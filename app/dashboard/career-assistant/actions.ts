"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { AIProviderError } from "@/lib/ai/errors";
import {
  CareerAssistantServiceError,
  createCareerAssistantSession,
  deleteCareerAssistantSession,
  sendCareerAssistantMessage,
  type CareerAssistantSessionDetail,
} from "@/services/career-assistant-service";
import type { CareerAssistantMessageRow } from "@/types/database";

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
  if (error instanceof CareerAssistantServiceError || error instanceof AIProviderError) return error.message;
  if (error instanceof UnauthenticatedError) return "Please sign in again to continue.";
  // Never leak raw Supabase/Postgres/provider error details, and never log
  // chat message content — feature label + nothing else.
  console.error("[career-assistant]", error);
  return "Something went wrong. Please try again.";
}

export async function createCareerAssistantSessionAction(): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const { supabase, user } = await requireUser();
    const session = await createCareerAssistantSession(supabase, user.id);

    revalidatePath("/dashboard/career-assistant");

    return { success: true, data: { sessionId: session.id } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function sendCareerAssistantMessageAction(
  sessionId: string,
  message: string,
): Promise<ActionResult<{ userMessage: CareerAssistantMessageRow; assistantMessage: CareerAssistantMessageRow }>> {
  try {
    const { supabase, user } = await requireUser();
    const result = await sendCareerAssistantMessage(supabase, user.id, sessionId, message);

    revalidatePath("/dashboard/career-assistant");

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function deleteCareerAssistantSessionAction(sessionId: string): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await requireUser();
    await deleteCareerAssistantSession(supabase, user.id, sessionId);

    revalidatePath("/dashboard/career-assistant");

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export type { CareerAssistantSessionDetail };

"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { AIProviderError } from "@/lib/ai/errors";
import { generateCoverLetterSchema, saveCoverLetterSchema, updateCoverLetterSchema } from "@/lib/validations/cover-letter";
import {
  CoverLetterServiceError,
  generateCoverLetterContent,
  saveCoverLetter,
  updateCoverLetterContent,
  deleteCoverLetter as deleteCoverLetterService,
} from "@/services/cover-letter-service";

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
  if (error instanceof CoverLetterServiceError || error instanceof AIProviderError) {
    return error.message;
  }
  if (error instanceof UnauthenticatedError) {
    return "Please sign in again to continue.";
  }
  console.error("[cover-letter]", error);
  return "Something went wrong. Please try again.";
}

/** Calls the AI provider and returns generated letter text — does not persist anything. */
export async function generateCoverLetterAction(input: unknown): Promise<ActionResult<{ content: string }>> {
  try {
    const parsed = generateCoverLetterSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    const content = await generateCoverLetterContent(supabase, user.id, parsed.data);

    return { success: true, data: { content } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function saveCoverLetterAction(input: unknown): Promise<ActionResult<{ coverLetterId: string }>> {
  try {
    const parsed = saveCoverLetterSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    const letter = await saveCoverLetter(supabase, user.id, parsed.data);

    revalidatePath("/dashboard/cover-letter/history");

    return { success: true, data: { coverLetterId: letter.id } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

/** Overwrites a saved letter's content — used when the user hand-edits generated text. */
export async function updateCoverLetterAction(input: unknown): Promise<ActionResult<null>> {
  try {
    const parsed = updateCoverLetterSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    await updateCoverLetterContent(supabase, user.id, parsed.data.id, parsed.data.content);

    revalidatePath("/dashboard/cover-letter/history");
    revalidatePath(`/dashboard/cover-letter/${parsed.data.id}`);

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function deleteCoverLetterAction(id: string): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await requireUser();
    await deleteCoverLetterService(supabase, user.id, id);

    revalidatePath("/dashboard/cover-letter/history");

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

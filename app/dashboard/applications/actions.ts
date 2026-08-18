"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateApplicationStatusSchema,
} from "@/lib/validations/applications";
import {
  ApplicationServiceError,
  createApplication,
  deleteApplication,
  findApplicationByJobId,
  markApplicationApplied,
  updateApplication,
  updateApplicationStatus,
} from "@/services/application-service";
import type { ApplicationRow } from "@/types/database";

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
  if (error instanceof ApplicationServiceError) return error.message;
  if (error instanceof UnauthenticatedError) return "Please sign in again to continue.";
  // Never leak raw Supabase/Postgres error details to the client.
  console.error("[applications]", error);
  return "Something went wrong. Please try again.";
}

function revalidateApplications(id?: string) {
  revalidatePath("/dashboard/applications");
  if (id) revalidatePath(`/dashboard/applications/${id}`);
}

export async function createApplicationAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = createApplicationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();

    // If this application is being created from a saved job, don't create a
    // duplicate — return the existing one instead.
    if (parsed.data.jobId) {
      const existing = await findApplicationByJobId(supabase, user.id, parsed.data.jobId);
      if (existing) return { success: true, data: { id: existing.id } };
    }

    const application = await createApplication(supabase, user.id, parsed.data);
    revalidateApplications();

    return { success: true, data: { id: application.id } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function updateApplicationAction(input: unknown): Promise<ActionResult<null>> {
  try {
    const parsed = updateApplicationSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    await updateApplication(supabase, user.id, parsed.data);
    revalidateApplications(parsed.data.id);

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function updateApplicationStatusAction(input: unknown): Promise<ActionResult<ApplicationRow>> {
  try {
    const parsed = updateApplicationStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    const application = await updateApplicationStatus(supabase, user.id, parsed.data.id, parsed.data.status);
    revalidateApplications(parsed.data.id);

    return { success: true, data: application };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

/**
 * The web-app half of "I submitted this application" (see Apply Assistant).
 * Only ever called from an explicit user confirmation click — never fired
 * automatically just because a job page or the Apply Assistant was opened.
 * The extension's equivalent event hits app/api/extension/mark-applied,
 * which calls the same markApplicationApplied() service function.
 */
export async function markApplicationAppliedAction(id: string): Promise<ActionResult<ApplicationRow>> {
  try {
    const { supabase, user } = await requireUser();
    const application = await markApplicationApplied(supabase, user.id, id);
    revalidateApplications(id);

    return { success: true, data: application };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function deleteApplicationAction(id: string): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await requireUser();
    await deleteApplication(supabase, user.id, id);
    revalidateApplications();

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

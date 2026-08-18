"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createJobSchema, updateJobSchema } from "@/lib/validations/jobs";
import { JobServiceError, createJob, deleteJob, updateJob } from "@/services/job-service";

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
  if (error instanceof JobServiceError) return error.message;
  if (error instanceof UnauthenticatedError) return "Please sign in again to continue.";
  // Never leak raw Supabase/Postgres error details to the client.
  console.error("[jobs]", error);
  return "Something went wrong. Please try again.";
}

export async function createJobAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = createJobSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    const job = await createJob(supabase, user.id, parsed.data);
    revalidatePath("/dashboard/jobs");

    return { success: true, data: { id: job.id } };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function updateJobAction(input: unknown): Promise<ActionResult<null>> {
  try {
    const parsed = updateJobSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
    }

    const { supabase, user } = await requireUser();
    await updateJob(supabase, user.id, parsed.data);
    revalidatePath("/dashboard/jobs");

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

export async function deleteJobAction(id: string): Promise<ActionResult<null>> {
  try {
    const { supabase, user } = await requireUser();
    await deleteJob(supabase, user.id, id);
    revalidatePath("/dashboard/jobs");

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: toSafeMessage(error) };
  }
}

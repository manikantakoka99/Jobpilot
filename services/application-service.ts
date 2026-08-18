import type { SupabaseClient } from "@supabase/supabase-js";

import type { ApplicationRow, ApplicationStatus, Database } from "@/types/database";
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@/lib/validations/applications";

type Client = SupabaseClient<Database>;

/** Thrown for expected, user-facing failures (not found, etc). */
export class ApplicationServiceError extends Error {}

export const APPLICATION_METRIC_STATUSES = [
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
] as const;

function toInsertRow(input: CreateApplicationInput) {
  return {
    job_id: input.jobId ?? null,
    job_title: input.jobTitle.trim(),
    company: input.company.trim(),
    job_url: input.jobUrl?.trim() || null,
    location: input.location?.trim() || null,
    salary: input.salary?.trim() || null,
    status: input.status ?? "Saved",
    source: input.source?.trim() || "manual",
    resume_id: input.resumeId ?? null,
    resume_version_id: input.resumeVersionId ?? null,
    cover_letter_id: input.coverLetterId ?? null,
    notes: input.notes?.trim() || null,
    follow_up_date: input.followUpDate ?? null,
  };
}

export async function listApplications(supabase: Client, userId: string): Promise<ApplicationRow[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Always filters by user_id explicitly — RLS already enforces this, but a browser-supplied id is never trusted alone. */
export async function getApplicationById(supabase: Client, userId: string, id: string): Promise<ApplicationRow | null> {
  const { data, error } = await supabase.from("applications").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Avoids creating a second application for the same saved job — returns the existing one if present. */
export async function findApplicationByJobId(supabase: Client, userId: string, jobId: string): Promise<ApplicationRow | null> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createApplication(supabase: Client, userId: string, input: CreateApplicationInput): Promise<ApplicationRow> {
  const status = input.status ?? "Saved";
  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: userId,
      ...toInsertRow(input),
      applied_at: status === "Applied" ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) throw new ApplicationServiceError("Failed to create application. Please try again.");
  return data;
}

export async function updateApplication(supabase: Client, userId: string, input: UpdateApplicationInput): Promise<ApplicationRow> {
  const { data, error } = await supabase
    .from("applications")
    .update({
      job_title: input.jobTitle.trim(),
      company: input.company.trim(),
      job_url: input.jobUrl?.trim() || null,
      location: input.location?.trim() || null,
      salary: input.salary?.trim() || null,
      resume_id: input.resumeId ?? null,
      resume_version_id: input.resumeVersionId ?? null,
      cover_letter_id: input.coverLetterId ?? null,
      notes: input.notes?.trim() || null,
      follow_up_date: input.followUpDate ?? null,
    })
    .eq("id", input.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new ApplicationServiceError("Failed to update application. Please try again.");
  return data;
}

/**
 * Changes status and, on first transition into "Applied", stamps applied_at —
 * the same helper backs both the dashboard status change and the extension's
 * "I submitted this application" event (see app/api/extension/mark-applied).
 * Never stamps applied_at just because a page was opened — only on an explicit
 * status change to "Applied".
 */
export async function updateApplicationStatus(
  supabase: Client,
  userId: string,
  id: string,
  status: ApplicationStatus,
): Promise<ApplicationRow> {
  const existing = await getApplicationById(supabase, userId, id);
  if (!existing) throw new ApplicationServiceError("Application not found.");

  const { data, error } = await supabase
    .from("applications")
    .update({
      status,
      applied_at: status === "Applied" ? existing.applied_at ?? new Date().toISOString() : existing.applied_at,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new ApplicationServiceError("Failed to update application status. Please try again.");
  return data;
}

/** Convenience wrapper for the "I submitted this application" confirmation (web quick-action and extension event). */
export async function markApplicationApplied(supabase: Client, userId: string, id: string): Promise<ApplicationRow> {
  return updateApplicationStatus(supabase, userId, id, "Applied");
}

export async function deleteApplication(supabase: Client, userId: string, id: string): Promise<void> {
  const { error } = await supabase.from("applications").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new ApplicationServiceError("Failed to delete application. Please try again.");
}

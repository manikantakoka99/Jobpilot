import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, JobRow } from "@/types/database";
import type { CreateJobInput, UpdateJobInput } from "@/lib/validations/jobs";

type Client = SupabaseClient<Database>;

/** Thrown for expected, user-facing failures (not found, etc). */
export class JobServiceError extends Error {}

function toRow(input: CreateJobInput) {
  return {
    title: input.title.trim(),
    company: input.company.trim(),
    url: input.url?.trim() || null,
    location: input.location?.trim() || null,
    description: input.description?.trim() || null,
    salary: input.salary?.trim() || null,
    source: input.source?.trim() || "manual",
  };
}

export async function listJobs(supabase: Client, userId: string): Promise<JobRow[]> {
  const { data, error } = await supabase.from("jobs").select("*").eq("user_id", userId).order("saved_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Always filters by user_id explicitly — RLS already enforces this, but a browser-supplied id is never trusted alone. */
export async function getJobById(supabase: Client, userId: string, jobId: string): Promise<JobRow | null> {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createJob(supabase: Client, userId: string, input: CreateJobInput): Promise<JobRow> {
  const { data, error } = await supabase
    .from("jobs")
    .insert({ user_id: userId, ...toRow(input) })
    .select("*")
    .single();

  if (error) throw new JobServiceError("Failed to save job. Please try again.");
  return data;
}

export async function updateJob(supabase: Client, userId: string, input: UpdateJobInput): Promise<JobRow> {
  const { data, error } = await supabase
    .from("jobs")
    .update(toRow(input))
    .eq("id", input.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new JobServiceError("Failed to update job. Please try again.");
  return data;
}

export async function deleteJob(supabase: Client, userId: string, jobId: string): Promise<void> {
  const { error } = await supabase.from("jobs").delete().eq("id", jobId).eq("user_id", userId);
  if (error) throw new JobServiceError("Failed to delete job. Please try again.");
}

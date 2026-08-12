import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, ResumeRow } from "@/types/database";
import { ALLOWED_MIME_TYPES, sniffMagicBytes, validateResumeFileMeta } from "@/lib/ats/file-validation";
import { extractResumeText } from "@/lib/ats/extract-text";

type Client = SupabaseClient<Database>;

/** Thrown for expected, user-facing failures (invalid file, not found, etc). */
export class ResumeServiceError extends Error {}

export async function listResumes(supabase: Client, userId: string): Promise<ResumeRow[]> {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Fetches a single resume, scoped to the given user. Always filters by
 * `user_id` explicitly — RLS already enforces this, but we never trust an
 * id coming from the browser without also verifying ownership here.
 */
export async function getResumeById(supabase: Client, userId: string, resumeId: string): Promise<ResumeRow | null> {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

/**
 * Validates, uploads, and extracts text from a resume file, then saves its
 * metadata + extracted text as a `resumes` row. Storage path is always
 * `{user_id}/{uuid}-{filename}` — never a client-supplied path.
 */
export async function uploadResume(supabase: Client, userId: string, file: File): Promise<ResumeRow> {
  const meta = validateResumeFileMeta(file);
  if (!meta.ok) throw new ResumeServiceError(meta.error);

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  if (!sniffMagicBytes(bytes, meta.fileType)) {
    throw new ResumeServiceError(
      "This file's contents don't match a valid PDF or DOCX file. It may be corrupted or mislabeled.",
    );
  }

  const path = `${userId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

  const { error: uploadError } = await supabase.storage.from("resumes").upload(path, bytes, {
    contentType: ALLOWED_MIME_TYPES[meta.fileType],
    upsert: false,
  });
  if (uploadError) {
    throw new ResumeServiceError("Failed to upload your resume. Please try again.");
  }

  const extraction = await extractResumeText(Buffer.from(bytes), meta.fileType);
  const extractedText = extraction.status === "success" ? extraction.text : null;

  const { data, error: insertError } = await supabase
    .from("resumes")
    .insert({
      user_id: userId,
      file_name: file.name,
      file_path: path,
      file_type: meta.fileType,
      file_size: file.size,
      extracted_text: extractedText,
      text_extraction_status: extraction.status,
    })
    .select("*")
    .single();

  if (insertError) {
    // Roll back the uploaded object so a failed insert doesn't leak an
    // orphaned file in Storage.
    await supabase.storage.from("resumes").remove([path]).catch(() => undefined);
    throw new ResumeServiceError("Failed to save your resume. Please try again.");
  }

  return data;
}

/**
 * Deletes a resume's Storage file and database row. `job_analyses` rows
 * referencing it are removed automatically via `on delete cascade`.
 * If the Storage delete fails, we still remove the database row rather
 * than leave the user with an undeletable "stuck" resume — the caller is
 * told via `storageDeleteFailed` so it can be surfaced (or silently
 * tolerated, since the file is orphaned but no longer accessible from the UI).
 */
export async function deleteResume(
  supabase: Client,
  userId: string,
  resumeId: string,
): Promise<{ storageDeleteFailed: boolean }> {
  const resume = await getResumeById(supabase, userId, resumeId);
  if (!resume) throw new ResumeServiceError("Resume not found.");

  const { error: storageError } = await supabase.storage.from("resumes").remove([resume.file_path]);
  const storageDeleteFailed = Boolean(storageError);

  const { error: dbError } = await supabase.from("resumes").delete().eq("id", resumeId).eq("user_id", userId);
  if (dbError) throw new ResumeServiceError("Failed to delete resume. Please try again.");

  return { storageDeleteFailed };
}

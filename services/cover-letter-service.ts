import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, CoverLetterRow } from "@/types/database";
import type { CoverLetterTone } from "@/lib/ai/types";
import { requireAIProvider } from "@/lib/ai/provider";
import { getProfile } from "./profile-service";
import { getResumeById } from "./resume-service";

type Client = SupabaseClient<Database>;

export class CoverLetterServiceError extends Error {}

const MIN_JOB_DESCRIPTION_LENGTH = 50;
const MAX_JOB_DESCRIPTION_LENGTH = 20000;

/** Resolves the resume text to ground the letter in: a specific version, or the original resume's extracted text. */
async function resolveResumeText(
  supabase: Client,
  userId: string,
  resumeId: string,
  resumeVersionId?: string | null,
): Promise<string> {
  if (resumeVersionId) {
    const { data, error } = await supabase
      .from("resume_versions")
      .select("content")
      .eq("id", resumeVersionId)
      .eq("user_id", userId)
      .eq("resume_id", resumeId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new CoverLetterServiceError("Selected resume version not found.");
    return data.content;
  }

  const resume = await getResumeById(supabase, userId, resumeId);
  if (!resume) throw new CoverLetterServiceError("Resume not found.");
  if (resume.text_extraction_status !== "success" || !resume.extracted_text) {
    throw new CoverLetterServiceError(
      "This resume has no extractable text yet. Please upload a text-based PDF or DOCX file first.",
    );
  }
  return resume.extracted_text;
}

export interface GenerateCoverLetterServiceInput {
  resumeId: string;
  resumeVersionId?: string | null;
  jobTitle: string;
  company?: string | null;
  jobDescription: string;
  tone: CoverLetterTone;
}

/** Calls the AI provider and returns generated letter text. Nothing is persisted here — see saveCoverLetter(). */
export async function generateCoverLetterContent(
  supabase: Client,
  userId: string,
  input: GenerateCoverLetterServiceInput,
): Promise<string> {
  const jobDescription = input.jobDescription.trim();
  if (jobDescription.length < MIN_JOB_DESCRIPTION_LENGTH) {
    throw new CoverLetterServiceError(
      `Please paste a fuller job description (at least ${MIN_JOB_DESCRIPTION_LENGTH} characters) so the letter is grounded in real requirements.`,
    );
  }
  if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
    throw new CoverLetterServiceError("Job description is too long. Please paste a shorter excerpt.");
  }

  const resumeText = await resolveResumeText(supabase, userId, input.resumeId, input.resumeVersionId);

  // Fail fast with a clear "not configured" error before touching the
  // profile/resume data further — never fake a result if no provider is set up.
  const provider = requireAIProvider();

  const profile = await getProfile(supabase, userId);

  const result = await provider.generateCoverLetter({
    resumeText,
    jobTitle: input.jobTitle,
    company: input.company,
    jobDescription,
    tone: input.tone,
    candidateProfile: {
      fullName: profile?.full_name ?? null,
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      location: profile?.location ?? null,
      linkedinUrl: profile?.linkedin_url ?? null,
      githubUrl: profile?.github_url ?? null,
      portfolioUrl: profile?.portfolio_url ?? null,
    },
  });

  return result.content;
}

export interface SaveCoverLetterInput {
  resumeId: string;
  resumeVersionId?: string | null;
  jobTitle: string;
  company?: string | null;
  jobDescription: string;
  tone: CoverLetterTone;
  content: string;
}

export async function saveCoverLetter(supabase: Client, userId: string, input: SaveCoverLetterInput): Promise<CoverLetterRow> {
  const resume = await getResumeById(supabase, userId, input.resumeId);
  if (!resume) throw new CoverLetterServiceError("Resume not found.");

  if (input.resumeVersionId) {
    const { data, error } = await supabase
      .from("resume_versions")
      .select("id")
      .eq("id", input.resumeVersionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new CoverLetterServiceError("Selected resume version not found.");
  }

  const { data, error } = await supabase
    .from("cover_letters")
    .insert({
      user_id: userId,
      resume_id: input.resumeId,
      resume_version_id: input.resumeVersionId ?? null,
      job_title: input.jobTitle.trim(),
      company: input.company?.trim() || null,
      job_description: input.jobDescription,
      tone: input.tone,
      content: input.content,
    })
    .select("*")
    .single();

  if (error) throw new CoverLetterServiceError("Failed to save cover letter. Please try again.");
  return data;
}

/** Overwrites a saved letter's content — used when a user hand-edits generated text. */
export async function updateCoverLetterContent(
  supabase: Client,
  userId: string,
  id: string,
  content: string,
): Promise<CoverLetterRow> {
  const { data, error } = await supabase
    .from("cover_letters")
    .update({ content })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new CoverLetterServiceError("Failed to update cover letter. Please try again.");
  return data;
}

export interface CoverLetterSummary {
  id: string;
  jobTitle: string;
  company: string | null;
  tone: string;
  createdAt: string;
}

export async function listCoverLetters(supabase: Client, userId: string): Promise<CoverLetterSummary[]> {
  const { data, error } = await supabase
    .from("cover_letters")
    .select("id, job_title, company, tone, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, jobTitle: r.job_title, company: r.company, tone: r.tone, createdAt: r.created_at }));
}

export async function getCoverLetterById(supabase: Client, userId: string, id: string): Promise<CoverLetterRow | null> {
  const { data, error } = await supabase.from("cover_letters").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteCoverLetter(supabase: Client, userId: string, id: string): Promise<void> {
  const { error } = await supabase.from("cover_letters").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new CoverLetterServiceError("Failed to delete cover letter. Please try again.");
}

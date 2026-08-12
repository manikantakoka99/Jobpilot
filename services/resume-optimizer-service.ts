import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json, ResumeVersionRow } from "@/types/database";
import type { ResumeChange } from "@/lib/validations/ai-output";
import { analyzeResume } from "@/lib/ats/analyze";
import { requireAIProvider } from "@/lib/ai/provider";
import { getResumeById } from "./resume-service";

type Client = SupabaseClient<Database>;

export class ResumeOptimizerServiceError extends Error {}

const MIN_JOB_DESCRIPTION_LENGTH = 50;
const MAX_JOB_DESCRIPTION_LENGTH = 20000;

export interface OptimizeResumeServiceInput {
  resumeId: string;
  sourceVersionId?: string | null;
  targetJobTitle: string;
  targetCompany?: string | null;
  jobDescription: string;
  useAtsContext: boolean;
}

/** Unsaved result of a single optimization run — shown to the user before they choose to save it as a new version. */
export interface OptimizePreview {
  resumeId: string;
  resumeFileName: string;
  sourceVersionId: string | null;
  targetJobTitle: string;
  targetCompany: string | null;
  jobDescription: string;
  originalText: string;
  optimizedText: string;
  changes: ResumeChange[];
  unsupportedRecommendations: string[];
  atsScoreOriginal: number;
  atsScoreOptimized: number;
  atsScoreDelta: number;
  remainingMissingKeywords: string[];
  remainingIssues: string[];
}

/** Resolves the resume text to optimize from: a specific existing version, or the original resume's extracted text. */
async function resolveSourceText(
  supabase: Client,
  userId: string,
  resumeId: string,
  sourceVersionId?: string | null,
): Promise<string> {
  if (sourceVersionId) {
    // Never trust a version id from the browser without verifying it belongs
    // to both the requesting user AND the selected resume.
    const { data, error } = await supabase
      .from("resume_versions")
      .select("content")
      .eq("id", sourceVersionId)
      .eq("user_id", userId)
      .eq("resume_id", resumeId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ResumeOptimizerServiceError("Selected resume version not found.");
    return data.content;
  }

  const resume = await getResumeById(supabase, userId, resumeId);
  if (!resume) throw new ResumeOptimizerServiceError("Resume not found.");
  if (resume.text_extraction_status !== "success" || !resume.extracted_text) {
    throw new ResumeOptimizerServiceError(
      "This resume has no extractable text yet. Please upload a text-based PDF or DOCX file before optimizing.",
    );
  }
  return resume.extracted_text;
}

/**
 * Runs one AI optimization pass and re-scores the result with the SAME
 * deterministic ATS engine used by Phase 2 — the optimized score is never
 * invented by the AI. Nothing is persisted here; see saveResumeVersion().
 */
export async function generateOptimizationPreview(
  supabase: Client,
  userId: string,
  input: OptimizeResumeServiceInput,
): Promise<OptimizePreview> {
  const jobDescription = input.jobDescription.trim();
  if (jobDescription.length < MIN_JOB_DESCRIPTION_LENGTH) {
    throw new ResumeOptimizerServiceError(
      `Please paste a fuller job description (at least ${MIN_JOB_DESCRIPTION_LENGTH} characters) so optimization is meaningful.`,
    );
  }
  if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
    throw new ResumeOptimizerServiceError("Job description is too long. Please paste a shorter excerpt.");
  }

  const resume = await getResumeById(supabase, userId, input.resumeId);
  if (!resume) throw new ResumeOptimizerServiceError("Resume not found.");

  const originalText = await resolveSourceText(supabase, userId, input.resumeId, input.sourceVersionId);

  const beforeAnalysis = analyzeResume(originalText, jobDescription);

  // Fail fast with a clear "not configured" error before spending any time
  // building context — never fake a result if no provider is set up.
  const provider = requireAIProvider();

  const atsContext = input.useAtsContext
    ? {
        atsScore: beforeAnalysis.atsScore,
        matchedKeywords: beforeAnalysis.keywordMatch.matchedKeywords,
        missingKeywords: beforeAnalysis.keywordMatch.missingKeywords,
        skillsFound: beforeAnalysis.skillsMatch.found.map((s) => s.name),
        skillsMissing: beforeAnalysis.skillsMatch.missing.map((s) => s.name),
        structureIssues: beforeAnalysis.structure.issues,
        recommendations: beforeAnalysis.recommendations.map((r) => r.message),
      }
    : null;

  const aiResult = await provider.optimizeResume({
    resumeText: originalText,
    jobTitle: input.targetJobTitle,
    company: input.targetCompany,
    jobDescription,
    atsContext,
  });

  // Never trust the AI's own claims about score improvement — re-run the
  // exact same deterministic engine used elsewhere in the app.
  const afterAnalysis = analyzeResume(aiResult.optimizedResumeText, jobDescription);

  return {
    resumeId: resume.id,
    resumeFileName: resume.file_name,
    sourceVersionId: input.sourceVersionId ?? null,
    targetJobTitle: input.targetJobTitle.trim(),
    targetCompany: input.targetCompany?.trim() || null,
    jobDescription,
    originalText,
    optimizedText: aiResult.optimizedResumeText,
    changes: aiResult.changes,
    unsupportedRecommendations: aiResult.unsupportedRecommendations,
    atsScoreOriginal: beforeAnalysis.atsScore,
    atsScoreOptimized: afterAnalysis.atsScore,
    atsScoreDelta: afterAnalysis.atsScore - beforeAnalysis.atsScore,
    remainingMissingKeywords: afterAnalysis.keywordMatch.missingKeywords,
    remainingIssues: [...afterAnalysis.structure.issues, ...afterAnalysis.formatting.issues],
  };
}

export interface SaveResumeVersionInput {
  resumeId: string;
  sourceVersionId?: string | null;
  versionName?: string | null;
  targetJobTitle: string;
  targetCompany?: string | null;
  jobDescription: string;
  content: string;
  changeSummary: ResumeChange[];
  atsScoreOriginal: number | null;
  atsScoreOptimized: number | null;
  remainingMissingKeywords: string[];
  remainingIssues: string[];
}

/** Persists a preview as a brand-new resume_versions row. Never overwrites the original resume or any prior version. */
export async function saveResumeVersion(
  supabase: Client,
  userId: string,
  input: SaveResumeVersionInput,
): Promise<ResumeVersionRow> {
  const resume = await getResumeById(supabase, userId, input.resumeId);
  if (!resume) throw new ResumeOptimizerServiceError("Resume not found.");

  if (input.sourceVersionId) {
    const { data, error } = await supabase
      .from("resume_versions")
      .select("id")
      .eq("id", input.sourceVersionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new ResumeOptimizerServiceError("Selected source version not found.");
  }

  const { data: latest, error: latestError } = await supabase
    .from("resume_versions")
    .select("version_number")
    .eq("resume_id", input.resumeId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;
  const nextVersionNumber = (latest?.version_number ?? 0) + 1;

  const atsScoreDelta =
    input.atsScoreOriginal != null && input.atsScoreOptimized != null
      ? input.atsScoreOptimized - input.atsScoreOriginal
      : null;

  const { data, error } = await supabase
    .from("resume_versions")
    .insert({
      resume_id: input.resumeId,
      user_id: userId,
      version_number: nextVersionNumber,
      version_name: input.versionName?.trim() || null,
      source_version_id: input.sourceVersionId ?? null,
      target_job_title: input.targetJobTitle.trim(),
      target_company: input.targetCompany?.trim() || null,
      job_description: input.jobDescription,
      content: input.content,
      change_summary: input.changeSummary as unknown as Json,
      ats_score_original: input.atsScoreOriginal,
      ats_score_optimized: input.atsScoreOptimized,
      ats_score_delta: atsScoreDelta,
      remaining_missing_keywords: input.remainingMissingKeywords,
      remaining_issues: input.remainingIssues,
    })
    .select("*")
    .single();

  if (error) throw new ResumeOptimizerServiceError("Failed to save resume version. Please try again.");
  return data;
}

export interface ResumeVersionSummary {
  id: string;
  resumeId: string;
  resumeFileName: string;
  versionNumber: number;
  versionName: string | null;
  targetJobTitle: string | null;
  targetCompany: string | null;
  atsScoreOriginal: number | null;
  atsScoreOptimized: number | null;
  atsScoreDelta: number | null;
  createdAt: string;
}

export async function listResumeVersions(supabase: Client, userId: string): Promise<ResumeVersionSummary[]> {
  const { data: versions, error } = await supabase
    .from("resume_versions")
    .select("id, resume_id, version_number, version_name, target_job_title, target_company, ats_score_original, ats_score_optimized, ats_score_delta, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!versions || versions.length === 0) return [];

  const resumeIds = Array.from(new Set(versions.map((v) => v.resume_id)));
  const { data: resumes, error: resumeError } = await supabase.from("resumes").select("id, file_name").in("id", resumeIds);
  if (resumeError) throw resumeError;
  const nameById = new Map((resumes ?? []).map((r) => [r.id, r.file_name]));

  return versions.map((v) => ({
    id: v.id,
    resumeId: v.resume_id,
    resumeFileName: nameById.get(v.resume_id) ?? "Unknown resume",
    versionNumber: v.version_number,
    versionName: v.version_name,
    targetJobTitle: v.target_job_title,
    targetCompany: v.target_company,
    atsScoreOriginal: v.ats_score_original,
    atsScoreOptimized: v.ats_score_optimized,
    atsScoreDelta: v.ats_score_delta,
    createdAt: v.created_at,
  }));
}

export async function getResumeVersionById(
  supabase: Client,
  userId: string,
  versionId: string,
): Promise<(ResumeVersionRow & { resumeFileName: string }) | null> {
  const { data, error } = await supabase
    .from("resume_versions")
    .select("*")
    .eq("id", versionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: resume } = await supabase.from("resumes").select("file_name").eq("id", data.resume_id).maybeSingle();
  return { ...data, resumeFileName: resume?.file_name ?? "Unknown resume" };
}

export async function listResumeVersionsForResume(
  supabase: Client,
  userId: string,
  resumeId: string,
): Promise<ResumeVersionRow[]> {
  const { data, error } = await supabase
    .from("resume_versions")
    .select("*")
    .eq("user_id", userId)
    .eq("resume_id", resumeId)
    .order("version_number", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Deletes a generated version. The original resume can only be removed via the existing resume-deletion flow. */
export async function deleteResumeVersion(supabase: Client, userId: string, versionId: string): Promise<void> {
  const { error } = await supabase.from("resume_versions").delete().eq("id", versionId).eq("user_id", userId);
  if (error) throw new ResumeOptimizerServiceError("Failed to delete resume version. Please try again.");
}

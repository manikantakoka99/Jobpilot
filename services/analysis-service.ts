import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, JobAnalysisRow, Json } from "@/types/database";
import type {
  EducationResult,
  ExperienceAlignmentResult,
  MatchedSkill,
  ReadabilityResult,
  Recommendation,
  ScoreBreakdown,
} from "@/lib/ats/types";
import { analyzeResume } from "@/lib/ats/analyze";
import { getResumeById } from "./resume-service";

type Client = SupabaseClient<Database>;

export class AnalysisServiceError extends Error {}

const MIN_JOB_DESCRIPTION_LENGTH = 50;
const MAX_JOB_DESCRIPTION_LENGTH = 20000;

export interface CreateAnalysisInput {
  resumeId: string;
  jobTitle?: string | null;
  jobDescription: string;
}

/** Extra findings not covered by the spec's dedicated columns — see 0003_resume_ats.sql. */
interface AnalysisDetails {
  experience: ExperienceAlignmentResult;
  education: EducationResult;
  readability: ReadabilityResult;
  importantMatchedKeywords: string[];
  importantMissingKeywords: string[];
  detectedSections: string[];
  missingSections: string[];
}

export async function createAnalysis(
  supabase: Client,
  userId: string,
  input: CreateAnalysisInput,
): Promise<JobAnalysisRow> {
  const jobDescription = input.jobDescription.trim();
  if (jobDescription.length < MIN_JOB_DESCRIPTION_LENGTH) {
    throw new AnalysisServiceError(
      `Please paste a fuller job description (at least ${MIN_JOB_DESCRIPTION_LENGTH} characters) so the analysis is meaningful.`,
    );
  }
  if (jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH) {
    throw new AnalysisServiceError("Job description is too long. Please paste a shorter excerpt.");
  }

  // Never trust a resume_id from the browser without verifying it belongs
  // to the requesting user.
  const resume = await getResumeById(supabase, userId, input.resumeId);
  if (!resume) {
    throw new AnalysisServiceError("Resume not found.");
  }
  if (resume.text_extraction_status !== "success" || !resume.extracted_text) {
    throw new AnalysisServiceError(
      "This resume has no extractable text yet. Please upload a text-based PDF or DOCX file before analyzing.",
    );
  }

  const result = analyzeResume(resume.extracted_text, jobDescription);

  const details: AnalysisDetails = {
    experience: result.experience,
    education: result.education,
    readability: result.readability,
    importantMatchedKeywords: result.keywordMatch.importantMatched,
    importantMissingKeywords: result.keywordMatch.importantMissing,
    detectedSections: result.structure.detectedSections,
    missingSections: result.structure.missingSections,
  };

  const { data, error } = await supabase
    .from("job_analyses")
    .insert({
      user_id: userId,
      resume_id: resume.id,
      job_title: input.jobTitle?.trim() || null,
      job_description: jobDescription,
      ats_score: result.atsScore,
      keyword_match_percentage: result.keywordMatch.matchPercentage,
      matched_keywords: result.keywordMatch.matchedKeywords,
      missing_keywords: result.keywordMatch.missingKeywords,
      // Cast to Json: these are plain interfaces (no index signature), which
      // TS won't structurally match to Json even though the runtime shape
      // (strings/numbers/nested objects) is always valid JSON.
      skills_found: result.skillsMatch.found as unknown as Json,
      skills_missing: result.skillsMatch.missing as unknown as Json,
      structure_issues: result.structure.issues,
      formatting_issues: result.formatting.issues,
      recommendations: result.recommendations as unknown as Json,
      score_breakdown: result.scoreBreakdown as unknown as Json,
      details: details as unknown as Json,
    })
    .select("*")
    .single();

  if (error) throw new AnalysisServiceError("Failed to save your analysis. Please try again.");
  return data;
}

export interface AnalysisSummary {
  id: string;
  jobTitle: string | null;
  atsScore: number;
  keywordMatchPercentage: number;
  createdAt: string;
  resumeFileName: string;
}

export async function listAnalyses(supabase: Client, userId: string): Promise<AnalysisSummary[]> {
  const { data: analyses, error } = await supabase
    .from("job_analyses")
    .select("id, job_title, ats_score, keyword_match_percentage, resume_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!analyses || analyses.length === 0) return [];

  const resumeIds = Array.from(new Set(analyses.map((a) => a.resume_id)));
  const { data: resumes, error: resumeError } = await supabase
    .from("resumes")
    .select("id, file_name")
    .in("id", resumeIds);
  if (resumeError) throw resumeError;

  const nameById = new Map((resumes ?? []).map((r) => [r.id, r.file_name]));

  return analyses.map((a) => ({
    id: a.id,
    jobTitle: a.job_title,
    atsScore: a.ats_score,
    keywordMatchPercentage: a.keyword_match_percentage,
    createdAt: a.created_at,
    resumeFileName: nameById.get(a.resume_id) ?? "Unknown resume",
  }));
}

/** Fully reconstructed, UI-ready shape of a saved analysis. */
export interface AnalysisView {
  id: string;
  jobTitle: string | null;
  jobDescription: string;
  createdAt: string;
  resumeFileName: string;
  atsScore: number;
  scoreBreakdown: ScoreBreakdown;
  matchedKeywords: string[];
  missingKeywords: string[];
  importantMatchedKeywords: string[];
  importantMissingKeywords: string[];
  keywordMatchPercentage: number;
  skillsFound: MatchedSkill[];
  skillsMissing: MatchedSkill[];
  detectedSections: string[];
  missingSections: string[];
  structureIssues: string[];
  formattingIssues: string[];
  experience: ExperienceAlignmentResult;
  education: EducationResult;
  readability: ReadabilityResult;
  recommendations: Recommendation[];
}

function toAnalysisView(row: JobAnalysisRow, resumeFileName: string): AnalysisView {
  const details = row.details as unknown as AnalysisDetails;

  return {
    id: row.id,
    jobTitle: row.job_title,
    jobDescription: row.job_description,
    createdAt: row.created_at,
    resumeFileName,
    atsScore: row.ats_score,
    scoreBreakdown: row.score_breakdown as unknown as ScoreBreakdown,
    matchedKeywords: (row.matched_keywords as unknown as string[]) ?? [],
    missingKeywords: (row.missing_keywords as unknown as string[]) ?? [],
    importantMatchedKeywords: details?.importantMatchedKeywords ?? [],
    importantMissingKeywords: details?.importantMissingKeywords ?? [],
    keywordMatchPercentage: row.keyword_match_percentage,
    skillsFound: (row.skills_found as unknown as MatchedSkill[]) ?? [],
    skillsMissing: (row.skills_missing as unknown as MatchedSkill[]) ?? [],
    detectedSections: details?.detectedSections ?? [],
    missingSections: details?.missingSections ?? [],
    structureIssues: (row.structure_issues as unknown as string[]) ?? [],
    formattingIssues: (row.formatting_issues as unknown as string[]) ?? [],
    experience: details?.experience,
    education: details?.education,
    readability: details?.readability,
    recommendations: (row.recommendations as unknown as Recommendation[]) ?? [],
  };
}

export async function getAnalysisView(supabase: Client, userId: string, analysisId: string): Promise<AnalysisView | null> {
  const { data, error } = await supabase
    .from("job_analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: resume } = await supabase.from("resumes").select("file_name").eq("id", data.resume_id).maybeSingle();

  return toAnalysisView(data, resume?.file_name ?? "Unknown resume");
}

export async function deleteAnalysis(supabase: Client, userId: string, analysisId: string): Promise<void> {
  const { error } = await supabase.from("job_analyses").delete().eq("id", analysisId).eq("user_id", userId);
  if (error) throw new AnalysisServiceError("Failed to delete analysis. Please try again.");
}

import { z } from "zod";

import { resumeChangeSchema } from "@/lib/validations/ai-output";

const MIN_JD_LENGTH = 50;
const MAX_JD_LENGTH = 20000;

/** Input for generating an optimization preview (calls the AI provider, does not persist anything). */
export const optimizeResumeSchema = z.object({
  resumeId: z.uuid("Please select a resume."),
  /** Optimize starting from a previously-generated version instead of the original resume. */
  sourceVersionId: z.uuid().optional(),
  targetJobTitle: z.string().trim().min(1, "Job title is required.").max(200, "Job title is too long."),
  targetCompany: z.string().trim().max(200, "Company name is too long.").optional(),
  jobDescription: z
    .string()
    .trim()
    .min(MIN_JD_LENGTH, `Paste a fuller job description (at least ${MIN_JD_LENGTH} characters) so optimization is meaningful.`)
    .max(MAX_JD_LENGTH, "Job description is too long. Please paste a shorter excerpt."),
  /** Whether to feed the existing deterministic ATS analysis in as grounding context. */
  useAtsContext: z.boolean(),
});

export type OptimizeResumeInput = z.infer<typeof optimizeResumeSchema>;

/** Input for persisting a previously-generated optimization preview as a new resume_versions row. */
export const saveResumeVersionSchema = z.object({
  resumeId: z.uuid(),
  sourceVersionId: z.uuid().optional(),
  versionName: z.string().trim().max(120, "Version name is too long.").optional(),
  targetJobTitle: z.string().trim().min(1).max(200),
  targetCompany: z.string().trim().max(200).optional(),
  jobDescription: z.string().trim().min(MIN_JD_LENGTH).max(MAX_JD_LENGTH),
  content: z.string().trim().min(1, "Optimized resume content is empty.").max(24000),
  changeSummary: z.array(resumeChangeSchema).max(60),
  atsScoreOriginal: z.number().int().min(0).max(100).nullable(),
  atsScoreOptimized: z.number().int().min(0).max(100).nullable(),
  remainingMissingKeywords: z.array(z.string().max(200)).max(200),
  remainingIssues: z.array(z.string().max(500)).max(200),
});

export type SaveResumeVersionInput = z.infer<typeof saveResumeVersionSchema>;

import { z } from "zod";

export const analyzeResumeSchema = z.object({
  resumeId: z.uuid("Please select a resume."),
  jobTitle: z.string().trim().max(200, "Job title is too long").optional(),
  jobDescription: z
    .string()
    .trim()
    .min(50, "Paste a fuller job description (at least 50 characters) so the analysis is meaningful.")
    .max(20000, "Job description is too long. Please paste a shorter excerpt."),
});

export type AnalyzeResumeInput = z.infer<typeof analyzeResumeSchema>;

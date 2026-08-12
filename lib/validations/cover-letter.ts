import { z } from "zod";

const MIN_JD_LENGTH = 50;
const MAX_JD_LENGTH = 20000;

export const coverLetterToneSchema = z.enum(["professional", "concise", "confident", "friendly"]);

/** Input for generating cover letter content (calls the AI provider, does not persist anything). */
export const generateCoverLetterSchema = z.object({
  resumeId: z.uuid("Please select a resume."),
  resumeVersionId: z.uuid().optional(),
  jobTitle: z.string().trim().min(1, "Job title is required.").max(200, "Job title is too long."),
  company: z.string().trim().max(200, "Company name is too long.").optional(),
  jobDescription: z
    .string()
    .trim()
    .min(MIN_JD_LENGTH, `Paste a fuller job description (at least ${MIN_JD_LENGTH} characters) so the letter is grounded.`)
    .max(MAX_JD_LENGTH, "Job description is too long. Please paste a shorter excerpt."),
  tone: coverLetterToneSchema,
});

export type GenerateCoverLetterInput = z.infer<typeof generateCoverLetterSchema>;

/** Input for persisting generated (or edited) cover letter content. */
export const saveCoverLetterSchema = z.object({
  resumeId: z.uuid(),
  resumeVersionId: z.uuid().optional(),
  jobTitle: z.string().trim().min(1).max(200),
  company: z.string().trim().max(200).optional(),
  jobDescription: z.string().trim().min(MIN_JD_LENGTH).max(MAX_JD_LENGTH),
  tone: coverLetterToneSchema,
  content: z.string().trim().min(1, "Cover letter content is empty.").max(8000),
});

export type SaveCoverLetterInput = z.infer<typeof saveCoverLetterSchema>;

export const updateCoverLetterSchema = z.object({
  id: z.uuid(),
  content: z.string().trim().min(1, "Cover letter content is empty.").max(8000),
});

export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>;

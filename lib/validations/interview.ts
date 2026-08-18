import { z } from "zod";

const MAX_JD_LENGTH = 20000;

/** Input for starting a new interview session — generates all of its questions up front via the AI provider. */
export const startInterviewSessionSchema = z.object({
  resumeId: z.uuid().optional(),
  resumeVersionId: z.uuid().optional(),
  jobId: z.uuid().optional(),
  jobTitle: z.string().trim().min(1, "Job title is required.").max(200, "Job title is too long."),
  company: z.string().trim().max(200, "Company name is too long.").optional(),
  jobDescription: z.string().trim().max(MAX_JD_LENGTH, "Job description is too long. Please paste a shorter excerpt.").optional(),
  mode: z.enum(["behavioral", "technical", "mixed"]),
  totalQuestions: z.number().int().min(3, "At least 3 questions.").max(12, "At most 12 questions."),
});
export type StartInterviewSessionInput = z.infer<typeof startInterviewSessionSchema>;

/** Input for submitting (or resubmitting) an answer to one question — evaluates it via the AI provider. */
export const submitInterviewAnswerSchema = z.object({
  questionId: z.uuid(),
  answerText: z.string().trim().min(1, "Please write an answer before submitting.").max(6000, "Answer is too long."),
});
export type SubmitInterviewAnswerInput = z.infer<typeof submitInterviewAnswerSchema>;

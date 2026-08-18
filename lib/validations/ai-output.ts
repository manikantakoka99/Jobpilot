import { z } from "zod";

/**
 * Zod schemas describing the exact shape an AI provider must return. These
 * double as the JSON schema handed to the provider (see lib/ai/provider.ts,
 * which converts them via `z.toJSONSchema()`) and as the runtime validator
 * applied to whatever the provider actually sends back — the app never
 * trusts AI output without validating it against these first.
 */

export const resumeChangeSchema = z.object({
  /** Short label for the resume section this change belongs to, e.g. "Professional Summary". */
  section: z.string().trim().min(1).max(120),
  original: z.string().trim().min(1).max(4000),
  optimized: z.string().trim().min(1).max(4000),
  /** Grounded, non-fabricating explanation of why this change was made. */
  reason: z.string().trim().min(1).max(600),
});

export const optimizeResumeOutputSchema = z.object({
  optimizedResumeText: z.string().trim().min(1).max(24000),
  changes: z.array(resumeChangeSchema).max(60),
  /**
   * Job-description requirements the resume doesn't support — phrased as
   * suggestions to the candidate, never fabricated into the resume itself.
   */
  unsupportedRecommendations: z.array(z.string().trim().min(1).max(500)).max(20),
});

export const generateCoverLetterOutputSchema = z.object({
  content: z.string().trim().min(1).max(8000),
});

export type ResumeChange = z.infer<typeof resumeChangeSchema>;
export type OptimizeResumeOutput = z.infer<typeof optimizeResumeOutputSchema>;
export type GenerateCoverLetterOutput = z.infer<typeof generateCoverLetterOutputSchema>;

export const interviewQuestionOutputSchema = z.object({
  category: z.enum(["behavioral", "technical"]),
  questionText: z.string().trim().min(1).max(600),
  /** Resume/job-description signals (skill names, technologies, snippets) this question is grounded in — empty for generic behavioral questions. */
  groundedIn: z.array(z.string().trim().min(1).max(120)).max(10),
});

export const generateInterviewQuestionsOutputSchema = z.object({
  questions: z.array(interviewQuestionOutputSchema).min(1).max(20),
});

export const evaluateInterviewAnswerOutputSchema = z.object({
  relevance: z.string().trim().min(1).max(500),
  clarity: z.string().trim().min(1).max(500),
  structure: z.string().trim().min(1).max(500),
  specificity: z.string().trim().min(1).max(500),
  confidence: z.string().trim().min(1).max(500),
  missingDetail: z.string().trim().min(1).max(500),
  /** 0-100 rating of this one answer — never a claim of factual expertise about the candidate, just an evaluation of what was said. */
  score: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1).max(600),
});

export const summarizeInterviewSessionOutputSchema = z.object({
  strengths: z.array(z.string().trim().min(1).max(300)).max(10),
  weaknesses: z.array(z.string().trim().min(1).max(300)).max(10),
  improvementSuggestions: z.array(z.string().trim().min(1).max(300)).max(10),
});

export const careerAssistantChatOutputSchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

export type InterviewQuestionOutput = z.infer<typeof interviewQuestionOutputSchema>;
export type GenerateInterviewQuestionsOutput = z.infer<typeof generateInterviewQuestionsOutputSchema>;
export type EvaluateInterviewAnswerOutput = z.infer<typeof evaluateInterviewAnswerOutputSchema>;
export type SummarizeInterviewSessionOutput = z.infer<typeof summarizeInterviewSessionOutputSchema>;
export type CareerAssistantChatOutput = z.infer<typeof careerAssistantChatOutputSchema>;

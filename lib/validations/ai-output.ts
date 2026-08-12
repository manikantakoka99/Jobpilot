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

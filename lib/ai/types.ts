import type { OptimizeResumeOutput, GenerateCoverLetterOutput } from "@/lib/validations/ai-output";

export type { OptimizeResumeOutput, GenerateCoverLetterOutput, ResumeChange } from "@/lib/validations/ai-output";

/** Reused Phase 2 ATS findings, passed in as optional grounding context — never a source of new facts. */
export interface AtsContextInput {
  atsScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  skillsFound: string[];
  skillsMissing: string[];
  structureIssues: string[];
  recommendations: string[];
}

export interface OptimizeResumeInput {
  resumeText: string;
  jobTitle: string;
  company?: string | null;
  jobDescription: string;
  atsContext?: AtsContextInput | null;
}

export interface CandidateProfileInput {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
}

export type CoverLetterTone = "professional" | "concise" | "confident" | "friendly";

export interface GenerateCoverLetterInput {
  resumeText: string;
  jobTitle: string;
  company?: string | null;
  jobDescription: string;
  tone: CoverLetterTone;
  candidateProfile: CandidateProfileInput;
}

/**
 * Vendor-neutral AI provider contract. Every concrete provider (currently
 * only Anthropic — see provider.ts) implements this and nothing else in the
 * app talks to a provider SDK directly.
 */
export interface AIProvider {
  readonly name: string;
  optimizeResume(input: OptimizeResumeInput): Promise<OptimizeResumeOutput>;
  generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput>;
}

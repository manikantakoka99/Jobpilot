import type {
  OptimizeResumeOutput,
  GenerateCoverLetterOutput,
  GenerateInterviewQuestionsOutput,
  EvaluateInterviewAnswerOutput,
  SummarizeInterviewSessionOutput,
  CareerAssistantChatOutput,
} from "@/lib/validations/ai-output";

export type {
  OptimizeResumeOutput,
  GenerateCoverLetterOutput,
  ResumeChange,
  InterviewQuestionOutput,
  GenerateInterviewQuestionsOutput,
  EvaluateInterviewAnswerOutput,
  SummarizeInterviewSessionOutput,
  CareerAssistantChatOutput,
} from "@/lib/validations/ai-output";

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

export type InterviewMode = "behavioral" | "technical" | "mixed";

/** Non-fabrication grounding signals for technical questions — never a new source of facts, only what's already present. */
export interface InterviewGroundingInput {
  resumeText: string;
  detectedSkills: string[];
}

export interface GenerateInterviewQuestionsInput {
  mode: InterviewMode;
  totalQuestions: number;
  jobTitle: string;
  company?: string | null;
  jobDescription: string;
  grounding: InterviewGroundingInput;
}

export interface EvaluateInterviewAnswerInput {
  questionText: string;
  category: "behavioral" | "technical";
  answerText: string;
  /** Same grounding context the question was generated from — lets feedback point out gaps without inventing candidate facts. */
  grounding: InterviewGroundingInput;
}

export interface InterviewQaPair {
  questionText: string;
  category: "behavioral" | "technical";
  answerText: string;
  score: number | null;
  feedbackSummary: string | null;
}

export interface SummarizeInterviewSessionInput {
  jobTitle: string;
  mode: InterviewMode;
  qaPairs: InterviewQaPair[];
}

export interface CareerAssistantChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CareerAssistantChatInput {
  /** Condensed, non-raw-text factual bundle built server-side (see services/career-assistant-service.ts) — never full resume/job-description text. */
  contextSummary: string;
  /** Recency-truncated prior turns only — full history stays in the DB, never all of it is sent to the provider. */
  history: CareerAssistantChatMessage[];
  message: string;
}

/**
 * Vendor-neutral AI provider contract. Every concrete provider (currently
 * only Groq — see provider.ts) implements this and nothing else in the app
 * talks to a provider SDK directly.
 */
export interface AIProvider {
  readonly name: string;
  optimizeResume(input: OptimizeResumeInput): Promise<OptimizeResumeOutput>;
  generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput>;
  generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput>;
  evaluateInterviewAnswer(input: EvaluateInterviewAnswerInput): Promise<EvaluateInterviewAnswerOutput>;
  summarizeInterviewSession(input: SummarizeInterviewSessionInput): Promise<SummarizeInterviewSessionOutput>;
  careerAssistantChat(input: CareerAssistantChatInput): Promise<CareerAssistantChatOutput>;
}

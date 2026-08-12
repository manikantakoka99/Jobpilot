/**
 * Shared types for the deterministic ATS analysis engine (lib/ats/**).
 *
 * Nothing in this module or its siblings calls an external AI/LLM API —
 * see lib/ats/scoring.ts for the weighting algorithm and README.md for a
 * plain-language explanation of how the score is computed.
 */

export type SkillCategory =
  | "programming"
  | "frameworks"
  | "cloud"
  | "databases"
  | "devops"
  | "cybersecurity"
  | "tools"
  | "certifications";

export interface SkillDefinition {
  /** Canonical, display-friendly name, e.g. "Node.js". */
  name: string;
  category: SkillCategory;
  /**
   * Lowercase surface forms to match against normalized text, e.g.
   * ["node.js", "nodejs", "node js"]. Always includes `name.toLowerCase()`.
   */
  variants: string[];
}

export interface MatchedSkill {
  name: string;
  category: SkillCategory;
}

export interface KeywordMatchResult {
  /** All keywords (skills + frequent JD terms) found in the resume. */
  matchedKeywords: string[];
  /** All keywords not found in the resume. */
  missingKeywords: string[];
  /** Subset of matchedKeywords that came from the curated skills dictionary. */
  importantMatched: string[];
  /** Subset of missingKeywords that came from the curated skills dictionary. */
  importantMissing: string[];
  /** matchedKeywords.length / totalKeywords.length, 0-100, 0 if no keywords found. */
  matchPercentage: number;
}

export interface SkillsMatchResult {
  found: MatchedSkill[];
  missing: MatchedSkill[];
}

export interface ExperienceRequirement {
  minYears: number | null;
  level: string | null;
  raw: string;
}

export interface ExperienceAlignmentResult {
  requirement: ExperienceRequirement | null;
  evidenceYears: number | null;
  evidenceLevels: string[];
  status: "not_required" | "met" | "insufficient_evidence" | "below_requirement";
  detail: string;
  score: number;
}

export interface EducationResult {
  requirements: string[];
  met: string[];
  missing: string[];
  score: number;
}

export interface StructureResult {
  detectedSections: string[];
  missingSections: string[];
  issues: string[];
  score: number;
}

export interface FormattingResult {
  issues: string[];
  score: number;
}

export interface ReadabilityResult {
  wordCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  hasContactInfo: boolean;
  notes: string[];
  score: number;
}

export interface ScoreBreakdown {
  keywordMatch: number;
  skillsMatch: number;
  experienceAlignment: number;
  educationCertification: number;
  resumeStructure: number;
  readability: number;
}

export type RecommendationPriority = "high" | "medium" | "low";

export interface Recommendation {
  priority: RecommendationPriority;
  message: string;
}

export interface AnalysisResult {
  atsScore: number;
  scoreBreakdown: ScoreBreakdown;
  keywordMatch: KeywordMatchResult;
  skillsMatch: SkillsMatchResult;
  experience: ExperienceAlignmentResult;
  education: EducationResult;
  structure: StructureResult;
  formatting: FormattingResult;
  readability: ReadabilityResult;
  recommendations: Recommendation[];
}

/** Text extraction outcome, shared by PDF and DOCX extractors. */
export type ExtractionResult =
  | { status: "success"; text: string }
  | { status: "no_text_layer" }
  | { status: "password_protected" }
  | { status: "failed"; reason: string };

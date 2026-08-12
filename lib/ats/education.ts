import type { EducationResult } from "./types";
import { containsPhrase, normalizeForMatch } from "./normalize";

interface EducationTerm {
  name: string;
  variants: string[];
}

const EDUCATION_TERMS: EducationTerm[] = [
  { name: "Bachelor's degree", variants: ["bachelor's degree", "bachelors degree", "bachelor degree", "b.s.", "b.a.", "bsc", "undergraduate degree"] },
  { name: "Master's degree", variants: ["master's degree", "masters degree", "master degree", "m.s.", "msc", "mba"] },
  { name: "PhD / Doctorate", variants: ["phd", "ph.d.", "doctorate"] },
  { name: "Associate degree", variants: ["associate degree", "associate's degree"] },
  { name: "Computer Science degree", variants: ["computer science degree", "cs degree", "computer science"] },
  { name: "AWS certification", variants: ["aws certified", "aws certification"] },
  { name: "Azure certification", variants: ["azure certified", "azure certification"] },
  { name: "Security+", variants: ["security+", "security plus"] },
  { name: "CISSP", variants: ["cissp"] },
  { name: "CCNA", variants: ["ccna"] },
  { name: "PMP certification", variants: ["pmp certification", "pmp"] },
  { name: "Scrum Master certification", variants: ["scrum master", "csm certification"] },
];

/** Detects explicit education/certification requirements mentioned in a job description. */
export function detectEducationRequirements(jobDescription: string): string[] {
  const normalized = normalizeForMatch(jobDescription);
  return EDUCATION_TERMS.filter((term) => term.variants.some((v) => containsPhrase(normalized, v))).map(
    (term) => term.name,
  );
}

/**
 * Compares detected requirements against the resume. Only counts a
 * requirement as "met" if the same term is explicitly present in the
 * resume text — never inferred.
 */
export function matchEducation(resumeText: string, jobDescription: string): EducationResult {
  const requirements = detectEducationRequirements(jobDescription);

  if (requirements.length === 0) {
    return { requirements: [], met: [], missing: [], score: 100 };
  }

  const resumeNormalized = normalizeForMatch(resumeText);
  const met: string[] = [];
  const missing: string[] = [];

  for (const reqName of requirements) {
    const term = EDUCATION_TERMS.find((t) => t.name === reqName);
    const isPresent = term ? term.variants.some((v) => containsPhrase(resumeNormalized, v)) : false;
    (isPresent ? met : missing).push(reqName);
  }

  const score = Math.round((met.length / requirements.length) * 100);

  return { requirements, met, missing, score };
}

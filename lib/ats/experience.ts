import type { ExperienceAlignmentResult, ExperienceRequirement } from "./types";
import { normalizeForMatch } from "./normalize";

const LEVEL_WORDS = ["entry level", "entry-level", "junior", "mid level", "mid-level", "senior", "lead", "principal", "staff"];

/** Looks for an explicit years-of-experience requirement, e.g. "3+ years", "5 years of experience". */
export function extractExperienceRequirement(jobDescription: string): ExperienceRequirement | null {
  const normalized = normalizeForMatch(jobDescription);

  const yearsMatch = normalized.match(/(\d{1,2})\s*\+?\s*(?:-\s*\d{1,2}\s*)?(?:years?|yrs?)\b/);
  const minYears = yearsMatch?.[1] ? Number.parseInt(yearsMatch[1], 10) : null;

  const level = LEVEL_WORDS.find((word) => normalized.includes(word)) ?? null;

  if (minYears === null && level === null) return null;

  return {
    minYears,
    level,
    raw: yearsMatch?.[0] ?? level ?? "",
  };
}

interface ExperienceEvidence {
  years: number | null;
  levels: string[];
}

/**
 * Looks for explicit statements of experience in the resume text itself.
 * Deliberately does not attempt to infer total years worked from a
 * timeline of dates — that would be a guess, and the spec requires we
 * never assume experience the candidate didn't state.
 */
export function extractExperienceEvidence(resumeText: string): ExperienceEvidence {
  const normalized = normalizeForMatch(resumeText);

  const yearsMatches = [...normalized.matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b/g)];
  const years = yearsMatches.length > 0
    ? Math.max(...yearsMatches.map((m) => Number.parseInt(m[1] ?? "0", 10)))
    : null;

  const levels = LEVEL_WORDS.filter((word) => normalized.includes(word));

  return { years, levels };
}

export function alignExperience(jobDescription: string, resumeText: string): ExperienceAlignmentResult {
  const requirement = extractExperienceRequirement(jobDescription);
  const evidence = extractExperienceEvidence(resumeText);

  if (!requirement) {
    return {
      requirement: null,
      evidenceYears: evidence.years,
      evidenceLevels: evidence.levels,
      status: "not_required",
      detail: "The job description doesn't state an explicit experience requirement.",
      score: 100,
    };
  }

  if (requirement.minYears !== null) {
    if (evidence.years === null) {
      return {
        requirement,
        evidenceYears: null,
        evidenceLevels: evidence.levels,
        status: "insufficient_evidence",
        detail: `The job asks for ${requirement.minYears}+ years of experience. Insufficient evidence in resume — no explicit years of experience found.`,
        score: 50,
      };
    }
    if (evidence.years >= requirement.minYears) {
      return {
        requirement,
        evidenceYears: evidence.years,
        evidenceLevels: evidence.levels,
        status: "met",
        detail: `The job asks for ${requirement.minYears}+ years; your resume states ${evidence.years} years, which meets this requirement.`,
        score: 100,
      };
    }
    return {
      requirement,
      evidenceYears: evidence.years,
      evidenceLevels: evidence.levels,
      status: "below_requirement",
      detail: `The job asks for ${requirement.minYears}+ years; your resume states ${evidence.years} years, which is below this requirement.`,
      score: 30,
    };
  }

  // Level-only requirement (e.g. "Senior") with no explicit year count.
  if (requirement.level && evidence.levels.includes(requirement.level)) {
    return {
      requirement,
      evidenceYears: evidence.years,
      evidenceLevels: evidence.levels,
      status: "met",
      detail: `The job asks for a "${requirement.level}" level; your resume mentions the same level.`,
      score: 100,
    };
  }

  return {
    requirement,
    evidenceYears: evidence.years,
    evidenceLevels: evidence.levels,
    status: "insufficient_evidence",
    detail: `The job asks for a "${requirement.level}" level. Insufficient evidence in resume to confirm this level.`,
    score: 50,
  };
}

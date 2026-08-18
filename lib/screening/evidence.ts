import { findSkillsIn } from "@/lib/ats/skills";

export interface ScreeningSuggestion {
  hasEvidence: boolean;
  matchedSkills: string[];
  suggestion: string;
}

/**
 * Deterministic, evidence-based suggestion for a screening question —
 * reuses the same skill dictionary/matcher the ATS engine uses
 * (lib/ats/skills.ts), no AI call and nothing invented. Only ever cites
 * skills that are literally present in both the question and the resume
 * text; if it can't find that overlap it says so plainly instead of
 * guessing.
 */
export function buildScreeningSuggestion(question: string, resumeText: string): ScreeningSuggestion {
  const questionSkills = findSkillsIn(question).map((s) => s.name);

  if (questionSkills.length === 0) {
    return {
      hasEvidence: false,
      matchedSkills: [],
      suggestion: "JobPilot cannot confidently answer this question.",
    };
  }

  const resumeSkillNames = new Set(findSkillsIn(resumeText).map((s) => s.name));
  const matched = questionSkills.filter((skill) => resumeSkillNames.has(skill));

  if (matched.length === 0) {
    return {
      hasEvidence: false,
      matchedSkills: [],
      suggestion: "Insufficient evidence in resume.",
    };
  }

  return {
    hasEvidence: true,
    matchedSkills: matched,
    suggestion: `Evidence found in resume: ${matched.join(", ")}`,
  };
}

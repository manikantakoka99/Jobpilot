import type { SkillsMatchResult } from "./types";
import { normalizeForMatch } from "./normalize";
import { SKILLS, skillPresentIn } from "./skills";

/**
 * Skills gap analysis: for every curated skill mentioned in the job
 * description, checks whether the resume also mentions it. Distinct from
 * the broader keyword match (lib/ats/keywords.ts), which also considers
 * generic frequent JD terms — this section is scoped to categorized,
 * high-confidence technical skills only.
 */
export function matchSkills(resumeText: string, jobDescription: string): SkillsMatchResult {
  const resumeNormalized = normalizeForMatch(resumeText);
  const jdNormalized = normalizeForMatch(jobDescription);

  const requiredSkills = SKILLS.filter((skill) => skillPresentIn(jdNormalized, skill));

  const found = requiredSkills
    .filter((skill) => skillPresentIn(resumeNormalized, skill))
    .map((skill) => ({ name: skill.name, category: skill.category }));

  const missing = requiredSkills
    .filter((skill) => !skillPresentIn(resumeNormalized, skill))
    .map((skill) => ({ name: skill.name, category: skill.category }));

  return { found, missing };
}

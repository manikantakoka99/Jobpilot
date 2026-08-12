import type { ScoreBreakdown } from "./types";

/**
 * ATS score weighting.
 *
 * Each sub-score below (keywordMatch, skillsMatch, ...) is independently
 * computed on a 0-100 scale by its own module (lib/ats/keywords.ts,
 * lib/ats/skills-match.ts, lib/ats/experience.ts, lib/ats/education.ts,
 * lib/ats/structure.ts, lib/ats/readability.ts). The final ATS score is
 * the weighted sum of those six sub-scores:
 *
 *   Keyword Match          35%
 *   Skills Match            25%
 *   Experience Alignment    15%
 *   Education/Certification 10%
 *   Resume Structure        10%
 *   Readability               5%
 *   ------------------------------
 *   Total                   100%
 *
 * The weighted sum is rounded and clamped to the 0-100 range.
 */
export const SCORE_WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  keywordMatch: 0.35,
  skillsMatch: 0.25,
  experienceAlignment: 0.15,
  educationCertification: 0.1,
  resumeStructure: 0.1,
  readability: 0.05,
};

export function calculateAtsScore(breakdown: ScoreBreakdown): number {
  let total = 0;
  for (const key of Object.keys(SCORE_WEIGHTS) as (keyof ScoreBreakdown)[]) {
    const subScore = clamp(breakdown[key], 0, 100);
    total += subScore * SCORE_WEIGHTS[key];
  }
  return Math.round(clamp(total, 0, 100));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

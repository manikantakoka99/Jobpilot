import type { AnalysisResult, ScoreBreakdown } from "./types";
import { matchKeywords } from "./keywords";
import { matchSkills } from "./skills-match";
import { alignExperience } from "./experience";
import { matchEducation } from "./education";
import { analyzeStructure } from "./structure";
import { analyzeFormatting } from "./formatting";
import { analyzeReadability } from "./readability";
import { generateRecommendations } from "./recommendations";
import { calculateAtsScore } from "./scoring";

/**
 * Runs the full deterministic ATS analysis pipeline against a resume's
 * extracted text and a job description. Pure function, no I/O, no network
 * calls, no AI/LLM API — see lib/ats/scoring.ts for the weighting formula.
 */
export function analyzeResume(resumeText: string, jobDescription: string): AnalysisResult {
  const keywordMatch = matchKeywords(resumeText, jobDescription);
  const skillsMatch = matchSkills(resumeText, jobDescription);
  const experience = alignExperience(jobDescription, resumeText);
  const education = matchEducation(resumeText, jobDescription);
  const structure = analyzeStructure(resumeText);
  const formatting = analyzeFormatting(resumeText);
  const readability = analyzeReadability(resumeText);

  const scoreBreakdown: ScoreBreakdown = {
    keywordMatch: keywordMatch.matchPercentage,
    skillsMatch: skillsMatch.found.length + skillsMatch.missing.length === 0
      ? 100
      : Math.round((skillsMatch.found.length / (skillsMatch.found.length + skillsMatch.missing.length)) * 100),
    experienceAlignment: experience.score,
    educationCertification: education.score,
    resumeStructure: structure.score,
    readability: readability.score,
  };

  const atsScore = calculateAtsScore(scoreBreakdown);

  const recommendations = generateRecommendations({
    keywordMatch,
    skillsMatch,
    experience,
    education,
    structure,
    formatting,
    readability,
  });

  return {
    atsScore,
    scoreBreakdown,
    keywordMatch,
    skillsMatch,
    experience,
    education,
    structure,
    formatting,
    readability,
    recommendations,
  };
}

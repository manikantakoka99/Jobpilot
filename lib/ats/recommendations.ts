import type {
  EducationResult,
  ExperienceAlignmentResult,
  FormattingResult,
  KeywordMatchResult,
  Recommendation,
  ReadabilityResult,
  SkillsMatchResult,
  StructureResult,
} from "./types";

interface RecommendationInputs {
  keywordMatch: KeywordMatchResult;
  skillsMatch: SkillsMatchResult;
  experience: ExperienceAlignmentResult;
  education: EducationResult;
  structure: StructureResult;
  formatting: FormattingResult;
  readability: ReadabilityResult;
}

const CORE_SECTIONS = new Set(["Skills", "Experience", "Education"]);

function capitalizedArticleFor(word: string): "A" | "An" {
  return /^[aeiou]/i.test(word) ? "An" : "A";
}

/**
 * Turns the raw analysis findings into a prioritized, actionable list.
 * Every recommendation is grounded in something the analysis actually
 * detected — never a suggestion to invent skills, certifications, or
 * experience the candidate didn't provide.
 */
export function generateRecommendations(inputs: RecommendationInputs): Recommendation[] {
  const { keywordMatch, skillsMatch, experience, education, structure, formatting, readability } = inputs;
  const recommendations: Recommendation[] = [];

  // --- High priority -------------------------------------------------
  for (const section of structure.missingSections) {
    if (CORE_SECTIONS.has(section)) {
      recommendations.push({
        priority: "high",
        message: `Add a "${section}" section — it's one of the core sections most ATS systems and recruiters look for, and it wasn't detected in your resume.`,
      });
    }
  }

  if (keywordMatch.matchPercentage < 40) {
    recommendations.push({
      priority: "high",
      message: `Your resume matches only ${keywordMatch.matchPercentage}% of the important terms in this job description. Review the missing keywords below and add any that genuinely reflect your experience.`,
    });
  }

  if (!readability.hasContactInfo) {
    recommendations.push({
      priority: "high",
      message: "No email or phone number was detected as text. Make sure your contact information is plain text, not embedded only in an image or header graphic.",
    });
  }

  // --- Medium priority -------------------------------------------------
  if (skillsMatch.missing.length > 0) {
    const topMissing = skillsMatch.missing.slice(0, 5).map((s) => s.name);
    recommendations.push({
      priority: "medium",
      message: `Consider adding ${topMissing.join(", ")} to your Skills section if you genuinely have experience with them — they're mentioned in the job description but weren't found in your resume.`,
    });
  }

  if (education.missing.length > 0) {
    recommendations.push({
      priority: "medium",
      message: `The job description mentions ${education.missing.join(", ")}. If you hold these, make sure they're explicitly listed in your resume — they weren't detected.`,
    });
  }

  if (experience.status === "insufficient_evidence") {
    recommendations.push({
      priority: "medium",
      message: "Consider stating your years of experience explicitly (e.g. \"5 years of experience in...\") so ATS systems and recruiters can verify you meet the job's requirement.",
    });
  } else if (experience.status === "below_requirement") {
    recommendations.push({
      priority: "medium",
      message: "Your stated experience is below what this job description asks for. Consider highlighting relevant projects or transferable experience that isn't reflected in your years count.",
    });
  }

  for (const section of structure.missingSections) {
    if (!CORE_SECTIONS.has(section) && (section === "Summary" || section === "Projects")) {
      recommendations.push({
        priority: "medium",
        message: `Consider adding a "${section}" section to give a fuller picture of your background.`,
      });
    }
  }

  // --- Low priority -------------------------------------------------
  for (const note of readability.notes) {
    // Contact-info note is already surfaced as "high" above.
    if (!note.startsWith("No email")) {
      recommendations.push({ priority: "low", message: note });
    }
  }

  for (const issue of formatting.issues) {
    recommendations.push({ priority: "low", message: issue });
  }

  for (const section of structure.missingSections) {
    if (section === "Certifications" || section === "Achievements" || section === "Contact") {
      recommendations.push({
        priority: "low",
        message: `${capitalizedArticleFor(section)} "${section}" section wasn't detected. Adding one is optional but can strengthen your resume if relevant.`,
      });
    }
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: "low",
      message: "No significant issues were found — this resume aligns well with the job description based on the checks performed.",
    });
  }

  return recommendations;
}

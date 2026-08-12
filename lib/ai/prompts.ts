/**
 * Centralized prompt templates for every AI-calling feature. Nothing else in
 * the app builds a provider prompt inline — see lib/ai/provider.ts for where
 * these are used.
 */
import type { OptimizeResumeInput, GenerateCoverLetterInput } from "./types";

const NO_FABRICATION_RULES = `
You must NEVER invent or fabricate any fact that isn't already present in the candidate's resume text below: no employers, job titles, dates, degrees, certifications, skills, technologies, projects, responsibilities, achievements, or metrics that aren't already there. You may only:
- Improve wording, clarity, conciseness, and action-verb usage
- Reorder or re-emphasize existing content for better alignment with the job description
- Align existing skills/experience with the job description's terminology, without inventing anything new
- Turn generic phrasing into more specific, achievement-oriented language using ONLY details already present in the resume
If the job description asks for a skill, tool, or qualification that genuinely does not appear anywhere in the resume or candidate info, do NOT add it — instead surface it as a suggestion (e.g. "Consider adding this skill if you genuinely have experience with it.") rather than inventing it.
Never invent a number, percentage, or metric that isn't already stated in the source material.
`.trim();

export function buildOptimizeResumeSystemPrompt(): string {
  return `You are a careful, honest resume-optimization assistant embedded in JobPilot AI. Your job is to improve how a candidate's EXISTING, TRUTHFUL resume content is worded and organized so it better matches a target job description — never to fabricate new content.

${NO_FABRICATION_RULES}

Respond only with the structured JSON described by the response schema — no prose outside it.`;
}

export function buildOptimizeResumeUserPrompt(input: OptimizeResumeInput): string {
  const ctx = input.atsContext;
  const atsSection = ctx
    ? `

Existing deterministic ATS analysis for this resume against this job description (grounded context — not a new source of facts):
- ATS score: ${ctx.atsScore}/100
- Matched keywords: ${ctx.matchedKeywords.join(", ") || "none"}
- Missing keywords: ${ctx.missingKeywords.join(", ") || "none"}
- Skills found: ${ctx.skillsFound.join(", ") || "none"}
- Skills missing: ${ctx.skillsMissing.join(", ") || "none"}
- Structure issues: ${ctx.structureIssues.join("; ") || "none"}
- Recommendations: ${ctx.recommendations.join("; ") || "none"}`
    : "";

  return `Target job title: ${input.jobTitle}
Target company: ${input.company || "Not specified"}

Job description:
"""
${input.jobDescription}
"""

Candidate's current resume text:
"""
${input.resumeText}
"""
${atsSection}

Produce an optimized version of this resume text, tailored to the job description above, following the rules in the system prompt. For every meaningful change, add a "changes" entry with the original snippet, the optimized snippet, and a short grounded reason (example: original "Worked on security monitoring." -> optimized "Monitored security events and investigated alerts using existing monitoring workflows." reason "Improved clarity and action-oriented wording without adding unsupported claims."). If the job description requires something the resume doesn't support, list it in "unsupportedRecommendations" instead of fabricating it into the resume.`;
}

export function buildCoverLetterSystemPrompt(): string {
  return `You are a careful, honest cover-letter-writing assistant embedded in JobPilot AI. Write a cover letter using ONLY the candidate's real resume content and profile information provided below plus the job description — never invent employers, titles, dates, skills, achievements, or metrics that aren't already present.

${NO_FABRICATION_RULES}

Respond only with the structured JSON described by the response schema — no prose outside it.`;
}

export function buildCoverLetterUserPrompt(input: GenerateCoverLetterInput): string {
  const profile = input.candidateProfile;
  const profileLines = [
    profile.fullName && `Name: ${profile.fullName}`,
    profile.email && `Email: ${profile.email}`,
    profile.phone && `Phone: ${profile.phone}`,
    profile.location && `Location: ${profile.location}`,
    profile.linkedinUrl && `LinkedIn: ${profile.linkedinUrl}`,
    profile.githubUrl && `GitHub: ${profile.githubUrl}`,
    profile.portfolioUrl && `Portfolio: ${profile.portfolioUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `Target job title: ${input.jobTitle}
Target company: ${input.company || "Not specified"}
Requested tone: ${input.tone}

Job description:
"""
${input.jobDescription}
"""

Candidate's resume text:
"""
${input.resumeText}
"""

Candidate's profile info on file:
${profileLines || "(no additional profile info on file)"}

Write a complete, ready-to-send cover letter (plain text, roughly 250-400 words, ${input.tone} tone) tailored to this job description, grounded only in the resume and profile information above. Use the real job title and company given above instead of placeholder brackets; if the company isn't specified, phrase the opening generically without a placeholder.`;
}

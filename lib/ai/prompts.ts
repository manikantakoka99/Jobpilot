/**
 * Centralized prompt templates for every AI-calling feature. Nothing else in
 * the app builds a provider prompt inline — see lib/ai/provider.ts for where
 * these are used.
 */
import type {
  OptimizeResumeInput,
  GenerateCoverLetterInput,
  GenerateInterviewQuestionsInput,
  EvaluateInterviewAnswerInput,
  SummarizeInterviewSessionInput,
  CareerAssistantChatInput,
} from "./types";

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

Respond with JSON ONLY — no prose, no markdown code fences, nothing outside the JSON object. The JSON object must have exactly these fields:
- "optimizedResumeText" (string): the full optimized resume text
- "changes" (array of objects, each with "section", "original", "optimized", "reason" — all strings): one entry per meaningful change
- "unsupportedRecommendations" (array of strings): job requirements the resume doesn't support, phrased as suggestions rather than fabricated into the resume`;
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

Respond with JSON ONLY — no prose, no markdown code fences, nothing outside the JSON object. The JSON object must have exactly one field: "content" (string), the complete cover letter text.`;
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

const INTERVIEW_NO_FABRICATION_RULES = `
You must NEVER claim or imply factual knowledge about the candidate beyond what's in the resume text and detected skills given below. You may only:
- Ask behavioral questions using common, generic STAR-style interview patterns (these don't require candidate-specific facts)
- Ask technical questions grounded ONLY in the skills, technologies, projects, and experience already present in the resume text / detected skills list, or in what the target job description asks for
If the job description requires a skill or technology that doesn't appear in the resume, you may still ask about it as something the role requires (e.g. "This role uses X — walk me through your experience with it, if any.") but never assert the candidate already has that experience.
`.trim();

export function buildInterviewQuestionsSystemPrompt(): string {
  return `You are a careful, honest interview-preparation assistant embedded in JobPilot AI. You generate a set of interview questions for a candidate preparing for a specific role.

${INTERVIEW_NO_FABRICATION_RULES}

Respond with JSON ONLY — no prose, no markdown code fences, nothing outside the JSON object. The JSON object must have exactly one field: "questions" (array of objects), each with:
- "category": either "behavioral" or "technical"
- "questionText": the interview question, a single clear sentence or two
- "groundedIn": array of short strings naming the specific skill/technology/resume detail a technical question is grounded in (empty array for behavioral questions)`;
}

export function buildInterviewQuestionsUserPrompt(input: GenerateInterviewQuestionsInput): string {
  const modeInstruction =
    input.mode === "behavioral"
      ? "Generate ONLY behavioral questions."
      : input.mode === "technical"
        ? "Generate ONLY technical questions."
        : "Generate a mix of behavioral and technical questions (roughly half and half).";

  return `Target job title: ${input.jobTitle}
Target company: ${input.company || "Not specified"}
Interview mode: ${input.mode}
Number of questions to generate: ${input.totalQuestions}

Job description:
"""
${input.jobDescription}
"""

Candidate's resume text (the ONLY source of candidate-specific facts):
"""
${input.grounding.resumeText}
"""

Skills detected in the resume (deterministic dictionary match, grounded context — not a new source of facts): ${input.grounding.detectedSkills.join(", ") || "none detected"}

${modeInstruction} Generate exactly ${input.totalQuestions} questions total, numbered implicitly by array order. Follow the rules in the system prompt — never invent employers, titles, dates, projects, or skills not present above.`;
}

export function buildAnswerFeedbackSystemPrompt(): string {
  return `You are a careful, honest interview coach embedded in JobPilot AI, giving feedback on one interview answer at a time.

${INTERVIEW_NO_FABRICATION_RULES}

Never falsely claim factual expertise about the candidate — your feedback is about the QUALITY of what they said in this answer, not a verification of whether it's true. Do not tell the candidate their answer is factually wrong about their own experience.

Respond with JSON ONLY — no prose, no markdown code fences, nothing outside the JSON object. The JSON object must have exactly these fields, each a short (1-3 sentence) piece of feedback except "score" and "summary":
- "relevance" (string): how well the answer addressed the question asked
- "clarity" (string): how clear and easy to follow the answer was
- "structure" (string): whether the answer was well organized (e.g. STAR structure for behavioral questions)
- "specificity" (string): whether the answer used concrete details/examples vs. vague generalities
- "confidence" (string): how confidently/directly the answer was phrased
- "missingDetail" (string): what a stronger answer would have included, grounded only in the question asked and general best practice — never inventing what the candidate "should have said happened"
- "score" (integer 0-100): overall rating of this one answer's quality
- "summary" (string): one or two sentence overall takeaway`;
}

export function buildAnswerFeedbackUserPrompt(input: EvaluateInterviewAnswerInput): string {
  return `Interview question (${input.category}):
"""
${input.questionText}
"""

Candidate's answer:
"""
${input.answerText}
"""

Candidate's resume text (grounded context for judging specificity/relevance — not a source of new facts to introduce):
"""
${input.grounding.resumeText}
"""

Skills detected in the resume: ${input.grounding.detectedSkills.join(", ") || "none detected"}

Evaluate this one answer following the rules in the system prompt.`;
}

export function buildInterviewSummarySystemPrompt(): string {
  return `You are a careful, honest interview coach embedded in JobPilot AI, writing a final summary for a completed mock interview session.

${INTERVIEW_NO_FABRICATION_RULES}

Base your summary ONLY on the questions, answers, and per-answer feedback given below — never invent an answer, event, or trait the candidate didn't actually demonstrate in this session.

Respond with JSON ONLY — no prose, no markdown code fences, nothing outside the JSON object. The JSON object must have exactly these fields:
- "strengths" (array of strings): patterns of strength actually observed across the answers given
- "weaknesses" (array of strings): patterns of weakness actually observed across the answers given
- "improvementSuggestions" (array of strings): concrete, actionable suggestions for next time, grounded in what was actually observed`;
}

export function buildInterviewSummaryUserPrompt(input: SummarizeInterviewSessionInput): string {
  const transcript = input.qaPairs
    .map(
      (qa, i) =>
        `Q${i + 1} (${qa.category}): ${qa.questionText}\nAnswer: ${qa.answerText}\n${qa.score != null ? `Score: ${qa.score}/100` : "Score: not evaluated"}${qa.feedbackSummary ? `\nFeedback given: ${qa.feedbackSummary}` : ""}`,
    )
    .join("\n\n");

  return `Target job title: ${input.jobTitle}
Interview mode: ${input.mode}

Full session transcript:
"""
${transcript}
"""

Write the final session summary following the rules in the system prompt.`;
}

export function buildCareerAssistantSystemPrompt(): string {
  return `You are the JobPilot AI career copilot — a careful, honest assistant that answers questions about the authenticated user's own JobPilot data (profile, resumes, resume versions, ATS analyses, applications, interview history, saved jobs).

You must clearly distinguish facts from stored data vs. your own suggestions or inferences — when giving an opinion, recommendation, or inference, phrase it as such (e.g. "Based on your data, you might consider…") rather than stating it as fact. NEVER invent application statuses, experiences, skills, job details, or interview results that aren't present in the context bundle given to you below. If the context doesn't contain enough information to answer, say so plainly instead of guessing.

The context bundle below is a condensed summary (names, scores, statuses, counts) — not raw resume or job description text — built fresh for this message. Treat it as the complete and only source of the user's JobPilot data; do not assume anything beyond it.

Respond with JSON ONLY — no prose, no markdown code fences, nothing outside the JSON object. The JSON object must have exactly one field: "message" (string), your reply in plain text (markdown-free), addressed directly to the user.`;
}

export function buildCareerAssistantUserPrompt(input: CareerAssistantChatInput): string {
  const historyBlock = input.history
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  return `The user's JobPilot data (condensed, factual context — the only source of facts about this user):
"""
${input.contextSummary}
"""
${historyBlock ? `\nRecent conversation so far:\n"""\n${historyBlock}\n"""\n` : ""}
User's new message:
"""
${input.message}
"""

Reply following the rules in the system prompt.`;
}

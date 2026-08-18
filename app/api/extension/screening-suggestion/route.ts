import { NextResponse, type NextRequest } from "next/server";

import { authenticateExtensionRequest, ExtensionAuthError } from "@/app/api/extension/_lib/auth";
import { screeningSuggestionSchema } from "@/lib/validations/extension";
import { getResumeById } from "@/services/resume-service";
import { getResumeVersionById } from "@/services/resume-optimizer-service";
import { buildScreeningSuggestion } from "@/lib/screening/evidence";

/**
 * POST /api/extension/screening-suggestion — detects whether the resume
 * has evidence for a screening question and returns a suggestion string,
 * never a submitted answer. Purely deterministic (lib/ats/skills.ts),
 * no AI call, and never fabricates a claim the resume doesn't support.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, userId } = await authenticateExtensionRequest(request);

    const body = await request.json().catch(() => null);
    const parsed = screeningSuggestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }

    const { question, resumeId, resumeVersionId } = parsed.data;

    let resumeText: string | null = null;
    if (resumeVersionId) {
      const version = await getResumeVersionById(supabase, userId, resumeVersionId);
      resumeText = version?.content ?? null;
    } else if (resumeId) {
      const resume = await getResumeById(supabase, userId, resumeId);
      resumeText = resume?.text_extraction_status === "success" ? resume.extracted_text : null;
    }

    if (!resumeText) {
      return NextResponse.json({
        hasEvidence: false,
        matchedSkills: [],
        suggestion: "JobPilot cannot confidently answer this question.",
      });
    }

    return NextResponse.json(buildScreeningSuggestion(question, resumeText));
  } catch (error) {
    if (error instanceof ExtensionAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/extension/screening-suggestion]", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

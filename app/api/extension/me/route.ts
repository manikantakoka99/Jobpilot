import { NextResponse, type NextRequest } from "next/server";

import { authenticateExtensionRequest, ExtensionAuthError } from "@/app/api/extension/_lib/auth";
import { getProfile } from "@/services/profile-service";
import { listResumes } from "@/services/resume-service";
import { listResumeVersions } from "@/services/resume-optimizer-service";
import { listCoverLetters } from "@/services/cover-letter-service";

function splitName(fullName: string | null): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: "", lastName: "" };
  const parts = fullName.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

/**
 * GET /api/extension/me — the data the extension's popup needs to suggest
 * form field values. Every value here is shown to the user for review
 * before insertion (see the extension's content script) — nothing is
 * inserted automatically.
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await authenticateExtensionRequest(request);

    const [profile, { data: authUser }, resumes, versions, letters] = await Promise.all([
      getProfile(supabase, userId),
      supabase.auth.admin.getUserById(userId),
      listResumes(supabase, userId),
      listResumeVersions(supabase, userId),
      listCoverLetters(supabase, userId),
    ]);

    const { firstName, lastName } = splitName(profile?.full_name ?? null);

    return NextResponse.json({
      profile: {
        firstName,
        lastName,
        fullName: profile?.full_name ?? "",
        email: authUser.user?.email ?? "",
        phone: profile?.phone ?? "",
        location: profile?.location ?? "",
        linkedinUrl: profile?.linkedin_url ?? "",
        githubUrl: profile?.github_url ?? "",
        portfolioUrl: profile?.portfolio_url ?? "",
      },
      resumes: resumes
        .filter((r) => r.text_extraction_status === "success")
        .map((r) => ({ id: r.id, label: r.file_name })),
      resumeVersions: versions.map((v) => ({
        id: v.id,
        resumeId: v.resumeId,
        label: v.versionName || `Version ${v.versionNumber}`,
      })),
      coverLetters: letters.map((l) => ({ id: l.id, label: l.company ? `${l.jobTitle} @ ${l.company}` : l.jobTitle })),
    });
  } catch (error) {
    if (error instanceof ExtensionAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/extension/me]", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

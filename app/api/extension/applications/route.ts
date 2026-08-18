import { NextResponse, type NextRequest } from "next/server";

import { authenticateExtensionRequest, ExtensionAuthError } from "@/app/api/extension/_lib/auth";
import { listApplications } from "@/services/application-service";
import { listResumes } from "@/services/resume-service";
import { listResumeVersions } from "@/services/resume-optimizer-service";
import { listCoverLetters } from "@/services/cover-letter-service";

/**
 * GET /api/extension/applications — a lightweight list for the popup's
 * "which application is this?" picker (used by the "I submitted this
 * application" flow), plus each application's selected resume/version/cover
 * letter so the extension can tell the user which document to attach. Every
 * list here reuses the same *-service functions the dashboard uses — no
 * separate query logic, read-only.
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await authenticateExtensionRequest(request);

    const [applications, resumes, versions, letters] = await Promise.all([
      listApplications(supabase, userId),
      listResumes(supabase, userId),
      listResumeVersions(supabase, userId),
      listCoverLetters(supabase, userId),
    ]);

    const resumeById = new Map(resumes.map((r) => [r.id, r.file_name]));
    const versionById = new Map(versions.map((v) => [v.id, v.versionName || `Version ${v.versionNumber}`]));
    const letterById = new Map(letters.map((l) => [l.id, l.company ? `${l.jobTitle} @ ${l.company}` : l.jobTitle]));

    return NextResponse.json({
      applications: applications.map((a) => ({
        id: a.id,
        jobTitle: a.job_title,
        company: a.company,
        jobUrl: a.job_url,
        status: a.status,
        selectedResume: a.resume_id ? { id: a.resume_id, label: resumeById.get(a.resume_id) ?? null } : null,
        selectedResumeVersion: a.resume_version_id
          ? { id: a.resume_version_id, label: versionById.get(a.resume_version_id) ?? null }
          : null,
        selectedCoverLetter: a.cover_letter_id
          ? { id: a.cover_letter_id, label: letterById.get(a.cover_letter_id) ?? null }
          : null,
      })),
    });
  } catch (error) {
    if (error instanceof ExtensionAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[api/extension/applications]", error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

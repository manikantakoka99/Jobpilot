import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getApplicationById } from "@/services/application-service";
import { getResumeById } from "@/services/resume-service";
import { getResumeVersionById } from "@/services/resume-optimizer-service";
import { getCoverLetterById } from "@/services/cover-letter-service";
import { ApplicationDetail } from "@/components/applications/application-detail";

export const metadata: Metadata = { title: "Application" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // getApplicationById always filters by the authenticated user's id — a
  // browser-supplied application id can never load another user's data.
  const application = await getApplicationById(supabase, user.id, id);
  if (!application) notFound();

  const [resume, resumeVersion, coverLetter] = await Promise.all([
    application.resume_id ? getResumeById(supabase, user.id, application.resume_id) : null,
    application.resume_version_id ? getResumeVersionById(supabase, user.id, application.resume_version_id) : null,
    application.cover_letter_id ? getCoverLetterById(supabase, user.id, application.cover_letter_id) : null,
  ]);

  return (
    <ApplicationDetail
      application={application}
      resumeFileName={resume?.file_name ?? null}
      resumeVersionLabel={resumeVersion ? resumeVersion.version_name || `Version ${resumeVersion.version_number}` : null}
      coverLetterJobTitle={coverLetter?.job_title ?? null}
    />
  );
}

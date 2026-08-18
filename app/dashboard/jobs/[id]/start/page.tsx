import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getJobById } from "@/services/job-service";
import { listResumes } from "@/services/resume-service";
import { listResumeVersions } from "@/services/resume-optimizer-service";
import { listCoverLetters } from "@/services/cover-letter-service";
import { StartApplicationForm } from "@/components/jobs/start-application-form";

export const metadata: Metadata = { title: "Start Application" };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function StartApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  // getJobById always filters by the authenticated user's id — a
  // browser-supplied job id can never load another user's job.
  const job = await getJobById(supabase, user.id, id);
  if (!job) notFound();

  const [resumes, versions, letters] = await Promise.all([
    listResumes(supabase, user.id),
    listResumeVersions(supabase, user.id),
    listCoverLetters(supabase, user.id),
  ]);

  return <StartApplicationForm job={job} resumes={resumes} versions={versions} letters={letters} />;
}

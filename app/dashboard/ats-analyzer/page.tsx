import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listResumes } from "@/services/resume-service";
import { getJobById } from "@/services/job-service";
import { AnalyzerForm } from "@/components/ats/analyzer-form";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AtsAnalyzerPage({
  searchParams,
}: {
  searchParams: Promise<{ resumeId?: string; jobId?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { resumeId, jobId } = await searchParams;
  const resumes = await listResumes(supabase, user.id);

  // getJobById always filters by the authenticated user's id — a
  // browser-supplied job id can never pull in another user's job.
  const job = jobId && UUID_RE.test(jobId) ? await getJobById(supabase, user.id, jobId) : null;

  return (
    <AnalyzerForm
      resumes={resumes}
      initialResumeId={resumeId}
      initialJobTitle={job?.title}
      initialJobDescription={job?.description ?? undefined}
    />
  );
}

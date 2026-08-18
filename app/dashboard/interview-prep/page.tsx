import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listResumes } from "@/services/resume-service";
import { listResumeVersions } from "@/services/resume-optimizer-service";
import { listJobs } from "@/services/job-service";
import { InterviewSetupForm } from "@/components/interview/interview-setup-form";

export default async function InterviewPrepPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [resumes, versions, jobs] = await Promise.all([
    listResumes(supabase, user.id),
    listResumeVersions(supabase, user.id),
    listJobs(supabase, user.id),
  ]);

  return <InterviewSetupForm resumes={resumes} versions={versions} jobs={jobs} />;
}

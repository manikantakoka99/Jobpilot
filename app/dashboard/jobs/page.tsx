import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listJobs } from "@/services/job-service";
import { JobBoard } from "@/components/jobs/job-board";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const jobs = await listJobs(supabase, user.id);

  return <JobBoard jobs={jobs} />;
}

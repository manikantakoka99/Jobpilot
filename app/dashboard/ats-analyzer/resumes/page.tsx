import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listResumes } from "@/services/resume-service";
import { ResumeList } from "@/components/ats/resume-list";

export const metadata: Metadata = { title: "My Resumes – ATS Analyzer" };

export default async function AtsResumesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const resumes = await listResumes(supabase, user.id);

  return <ResumeList resumes={resumes} />;
}

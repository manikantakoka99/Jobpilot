import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listResumes } from "@/services/resume-service";
import { listResumeVersions } from "@/services/resume-optimizer-service";
import { CoverLetterForm } from "@/components/cover-letter/cover-letter-form";

export default async function CoverLetterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [resumes, versions] = await Promise.all([listResumes(supabase, user.id), listResumeVersions(supabase, user.id)]);

  return <CoverLetterForm resumes={resumes} versions={versions} />;
}

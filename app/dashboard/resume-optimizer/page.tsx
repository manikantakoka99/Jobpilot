import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listResumes } from "@/services/resume-service";
import { listResumeVersions } from "@/services/resume-optimizer-service";
import { OptimizerForm } from "@/components/optimizer/optimizer-form";

export default async function ResumeOptimizerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [resumes, versions] = await Promise.all([listResumes(supabase, user.id), listResumeVersions(supabase, user.id)]);

  return <OptimizerForm resumes={resumes} versions={versions} />;
}

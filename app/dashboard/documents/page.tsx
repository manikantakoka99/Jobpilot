import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { listResumes } from "@/services/resume-service";
import { listResumeVersions } from "@/services/resume-optimizer-service";
import { listCoverLetters } from "@/services/cover-letter-service";
import { DocumentResumes } from "@/components/documents/document-resumes";
import { DocumentResumeVersions } from "@/components/documents/document-resume-versions";
import { DocumentCoverLetters } from "@/components/documents/document-cover-letters";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [resumes, versions, letters] = await Promise.all([
    listResumes(supabase, user.id),
    listResumeVersions(supabase, user.id),
    listCoverLetters(supabase, user.id),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Resumes</h2>
          <p className="text-muted-foreground text-sm">Original files you&apos;ve uploaded.</p>
        </div>
        <DocumentResumes resumes={resumes} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Resume Versions</h2>
          <p className="text-muted-foreground text-sm">AI-optimized versions saved from the Resume Optimizer.</p>
        </div>
        <DocumentResumeVersions versions={versions} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Cover Letters</h2>
          <p className="text-muted-foreground text-sm">Generated cover letters, grouped by job.</p>
        </div>
        <DocumentCoverLetters letters={letters} />
      </section>
    </div>
  );
}

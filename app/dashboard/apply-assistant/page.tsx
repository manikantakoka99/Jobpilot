import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MousePointerClick } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getApplicationById } from "@/services/application-service";
import { getResumeById } from "@/services/resume-service";
import { getResumeVersionById } from "@/services/resume-optimizer-service";
import { getCoverLetterById } from "@/services/cover-letter-service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ApplyAssistant } from "@/components/apply-assistant/apply-assistant";

export const metadata: Metadata = { title: "Apply Assistant" };

interface ApplyAssistantPageProps {
  searchParams: Promise<{ applicationId?: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ApplyAssistantPage({ searchParams }: ApplyAssistantPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { applicationId } = await searchParams;

  const application = applicationId && UUID_RE.test(applicationId) ? await getApplicationById(supabase, user.id, applicationId) : null;

  if (!application) {
    return (
      <Card>
        <EmptyState
          icon={MousePointerClick}
          title="No application selected"
          description="Start an application from a saved job to open the Apply Assistant."
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/jobs">Go to Jobs</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const [resume, resumeVersion, coverLetter] = await Promise.all([
    application.resume_id ? getResumeById(supabase, user.id, application.resume_id) : null,
    application.resume_version_id ? getResumeVersionById(supabase, user.id, application.resume_version_id) : null,
    application.cover_letter_id ? getCoverLetterById(supabase, user.id, application.cover_letter_id) : null,
  ]);

  return (
    <ApplyAssistant
      application={application}
      resumeFileName={resume?.file_name ?? null}
      resumeVersionLabel={resumeVersion ? resumeVersion.version_name || `Version ${resumeVersion.version_number}` : null}
      coverLetterJobTitle={coverLetter?.job_title ?? null}
    />
  );
}

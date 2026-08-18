"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, ExternalLink, FileText, Info, Loader2, Mail, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { markApplicationAppliedAction } from "@/app/dashboard/applications/actions";
import type { ApplicationRow } from "@/types/database";

interface ApplyAssistantProps {
  application: ApplicationRow;
  resumeFileName: string | null;
  resumeVersionLabel: string | null;
  coverLetterJobTitle: string | null;
}

/**
 * Apply Assistant: a launchpad, not an auto-submitter. "Open Application"
 * just opens the job posting in a new tab — the Chrome extension (installed
 * separately) can suggest field values there, but the user fills the form
 * and clicks the real Submit button themselves. Nothing here submits
 * anything on the user's behalf.
 */
export function ApplyAssistant({ application, resumeFileName, resumeVersionLabel, coverLetterJobTitle }: ApplyAssistantProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = React.useState(false);

  async function handleConfirmSubmitted() {
    setIsConfirming(true);
    const result = await markApplicationAppliedAction(application.id);
    setIsConfirming(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Marked as applied");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{application.job_title}</h2>
        <p className="text-muted-foreground flex items-center gap-1 text-sm">
          <Building2 className="size-3.5" /> {application.company}
        </p>
      </div>

      <Alert>
        <Info />
        <AlertTitle>Review everything before submitting</AlertTitle>
        <AlertDescription>
          JobPilot can help fill common application fields once you install the Chrome extension — but it never submits anything for
          you. Always review every field the extension suggests, and click the site&apos;s own Submit button yourself.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Selected documents</CardTitle>
          <CardDescription>What you chose when preparing this application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <FileText className="text-muted-foreground size-3.5" />
            Resume: <span className="font-medium">{resumeFileName ?? "Not set"}</span>
          </p>
          <p className="flex items-center gap-2">
            <FileText className="text-muted-foreground size-3.5" />
            Version: <span className="font-medium">{resumeVersionLabel ?? "Original resume"}</span>
          </p>
          <p className="flex items-center gap-2">
            <Mail className="text-muted-foreground size-3.5" />
            Cover letter: <span className="font-medium">{coverLetterJobTitle ?? "Not set"}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open the application</CardTitle>
          <CardDescription>Opens the job posting in a new tab so you can apply directly on the employer&apos;s site.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {application.job_url ? (
            <Button asChild>
              <a href={application.job_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> Open Application
              </a>
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm">
              No job URL saved for this application.{" "}
              <Link href={`/dashboard/applications/${application.id}`} className="text-primary hover:underline">
                Add one
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confirm submission</CardTitle>
          <CardDescription>
            Once you&apos;ve submitted the application on the employer&apos;s site, confirm here — JobPilot never marks an application as
            Applied automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {application.status === "Applied" ? (
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> Marked as applied
            </p>
          ) : (
            <Button type="button" variant="outline" disabled={isConfirming} onClick={handleConfirmSubmitted}>
              {isConfirming ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              I submitted this application
            </Button>
          )}
        </CardContent>
      </Card>

      <Alert variant="destructive">
        <ShieldAlert />
        <AlertTitle>No automated submission</AlertTitle>
        <AlertDescription>
          JobPilot does not and will not automatically submit applications on LinkedIn, Indeed, or any other platform. The final Submit
          action always stays with you.
        </AlertDescription>
      </Alert>
    </div>
  );
}

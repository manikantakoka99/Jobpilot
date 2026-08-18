"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Calendar, CalendarClock, ExternalLink, FileText, Loader2, Mail, MapPin, PenLine, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { ApplicationStatusMenu } from "@/components/applications/application-status-menu";
import { ApplicationFormSheet } from "@/components/applications/application-form-sheet";
import { deleteApplicationAction } from "@/app/dashboard/applications/actions";
import { getResumeUrlAction } from "@/app/dashboard/documents/actions";
import { formatDateTime } from "@/lib/format";
import type { ApplicationRow, ApplicationStatus } from "@/types/database";

interface ApplicationDetailProps {
  application: ApplicationRow;
  resumeFileName: string | null;
  resumeVersionLabel: string | null;
  coverLetterJobTitle: string | null;
}

export function ApplicationDetail({ application: initial, resumeFileName, resumeVersionLabel, coverLetterJobTitle }: ApplicationDetailProps) {
  const router = useRouter();
  const [application, setApplication] = React.useState(initial);
  const [isOpeningResume, setIsOpeningResume] = React.useState(false);

  function handleStatusChanged(status: ApplicationStatus) {
    setApplication((prev) => ({
      ...prev,
      status,
      applied_at: status === "Applied" ? (prev.applied_at ?? new Date().toISOString()) : prev.applied_at,
    }));
  }

  async function handleOpenResume() {
    if (!application.resume_id) return;
    setIsOpeningResume(true);
    const result = await getResumeUrlAction(application.resume_id);
    setIsOpeningResume(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    window.open(result.data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-xl font-semibold tracking-tight">{application.job_title}</h2>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5" /> {application.company}
            </span>
            {application.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {application.location}
              </span>
            )}
            {application.salary && (
              <span className="inline-flex items-center gap-1">
                <Wallet className="size-3.5" /> {application.salary}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ApplicationStatusMenu applicationId={application.id} status={application.status} onChanged={handleStatusChanged} />
          <ApplicationFormSheet
            application={application}
            onSaved={() => router.refresh()}
            trigger={
              <Button type="button" variant="outline" size="sm">
                <PenLine className="size-3.5" /> Edit
              </Button>
            }
          />
          <ConfirmDeleteButton
            action={() => deleteApplicationAction(application.id)}
            successMessage="Application deleted"
            onDeleted={() => router.push("/dashboard/applications")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="size-3.5" /> Created {formatDateTime(application.created_at)}
            </p>
            {application.applied_at && (
              <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="size-3.5" /> Applied {formatDateTime(application.applied_at)}
              </p>
            )}
            {application.follow_up_date && (
              <Badge variant="outline" className="gap-1">
                <CalendarClock className="size-3" /> Follow up {application.follow_up_date}
              </Badge>
            )}
            {application.job_url && (
              <a
                href={application.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="size-3.5" /> Open job posting
              </a>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <FileText className="size-3.5" /> Resume
              </span>
              {resumeFileName ? (
                <Button type="button" variant="ghost" size="sm" disabled={isOpeningResume} onClick={handleOpenResume}>
                  {isOpeningResume ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  {resumeFileName}
                </Button>
              ) : (
                <span className="text-muted-foreground">Not set</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <FileText className="size-3.5" /> Resume version
              </span>
              {resumeVersionLabel && application.resume_version_id ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/dashboard/resume-optimizer/versions/${application.resume_version_id}`}>{resumeVersionLabel}</Link>
                </Button>
              ) : (
                <span className="text-muted-foreground">Not set</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <Mail className="size-3.5" /> Cover letter
              </span>
              {coverLetterJobTitle && application.cover_letter_id ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/dashboard/cover-letter/${application.cover_letter_id}`}>{coverLetterJobTitle}</Link>
                </Button>
              ) : (
                <span className="text-muted-foreground">Not set</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {application.notes ? (
            <p className="text-sm whitespace-pre-wrap">{application.notes}</p>
          ) : (
            <p className="text-muted-foreground text-sm">No notes yet — add some from Edit.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

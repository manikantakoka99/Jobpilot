"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ExternalLink } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { ApplicationStatusMenu } from "@/components/applications/application-status-menu";
import { ApplicationFormSheet } from "@/components/applications/application-form-sheet";
import { deleteApplicationAction } from "@/app/dashboard/applications/actions";
import { APPLICATION_STATUSES } from "@/lib/validations/applications";
import { formatDateTime } from "@/lib/format";
import type { ApplicationRow, ApplicationStatus } from "@/types/database";

export function ApplicationBoard({ applications: initial }: { applications: ApplicationRow[] }) {
  const router = useRouter();
  const [applications, setApplications] = React.useState(initial);

  function handleStatusChanged(id: string, status: ApplicationStatus) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {applications.length} {applications.length === 1 ? "application" : "applications"}
        </p>
        <ApplicationFormSheet onSaved={() => router.refresh()} />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {APPLICATION_STATUSES.map((status) => {
          const columnApps = applications.filter((a) => a.status === status);
          return (
            <div key={status} className="w-72 shrink-0 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">{status}</h3>
                <Badge variant="secondary">{columnApps.length}</Badge>
              </div>

              <div className="space-y-2">
                {columnApps.map((application) => (
                  <Card key={application.id} className="space-y-2 p-3">
                    <Link href={`/dashboard/applications/${application.id}`} className="block min-w-0">
                      <p className="truncate text-sm font-medium">{application.job_title}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {application.company}
                        {application.location && ` · ${application.location}`}
                      </p>
                    </Link>

                    {application.follow_up_date && (
                      <Badge variant="outline" className="gap-1">
                        <CalendarClock className="size-3" /> Follow up {application.follow_up_date}
                      </Badge>
                    )}

                    <p className="text-muted-foreground text-[11px]">Updated {formatDateTime(application.updated_at)}</p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <ApplicationStatusMenu
                        applicationId={application.id}
                        status={application.status}
                        onChanged={(next) => handleStatusChanged(application.id, next)}
                      />
                      {application.job_url && (
                        <a
                          href={application.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground inline-flex size-7 items-center justify-center rounded-lg"
                          aria-label="Open job posting"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                      <ConfirmDeleteButton
                        action={() => deleteApplicationAction(application.id)}
                        successMessage="Application deleted"
                        onDeleted={() => setApplications((prev) => prev.filter((a) => a.id !== application.id))}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

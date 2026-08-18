"use client";

import * as React from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { updateApplicationStatusAction } from "@/app/dashboard/applications/actions";
import { APPLICATION_STATUSES } from "@/lib/validations/applications";
import type { ApplicationStatus } from "@/types/database";

interface ApplicationStatusMenuProps {
  applicationId: string;
  status: ApplicationStatus;
  onChanged?: (status: ApplicationStatus) => void;
}

/** Changing status here — and only here — is what stamps applied_at when moving into "Applied". See updateApplicationStatus in application-service.ts. */
export function ApplicationStatusMenu({ applicationId, status, onChanged }: ApplicationStatusMenuProps) {
  const [isPending, setIsPending] = React.useState(false);

  async function handleSelect(next: ApplicationStatus) {
    if (next === status || isPending) return;
    setIsPending(true);

    const result = await updateApplicationStatusAction({ id: applicationId, status: next });

    setIsPending(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`Moved to ${next}`);
    onChanged?.(next);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {status}
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {APPLICATION_STATUSES.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => handleSelect(s)}>
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

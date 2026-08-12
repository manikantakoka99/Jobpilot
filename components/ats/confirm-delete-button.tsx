"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/app/dashboard/ats-analyzer/actions";

interface ConfirmDeleteButtonProps {
  action: () => Promise<ActionResult<unknown>>;
  onDeleted?: () => void;
  label?: string;
  successMessage?: string;
}

/** A destructive action button that requires a second click within a few seconds to confirm. */
export function ConfirmDeleteButton({ action, onDeleted, label = "Delete", successMessage = "Deleted" }: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  async function handleClick() {
    if (!confirming) {
      setConfirming(true);
      timeoutRef.current = setTimeout(() => setConfirming(false), 4000);
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setIsPending(true);
    const result = await action();
    setIsPending(false);
    setConfirming(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(successMessage);
    onDeleted?.();
  }

  return (
    <Button
      type="button"
      variant={confirming ? "destructive" : "ghost"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="shrink-0"
    >
      {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      {confirming ? "Confirm?" : label}
    </Button>
  );
}

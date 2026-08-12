"use client";

import { useRouter } from "next/navigation";

import { ConfirmDeleteButton } from "@/components/ats/confirm-delete-button";
import { deleteAnalysisAction } from "@/app/dashboard/ats-analyzer/actions";

export function AnalysisDeleteButton({ analysisId }: { analysisId: string }) {
  const router = useRouter();

  return (
    <ConfirmDeleteButton
      action={() => deleteAnalysisAction(analysisId)}
      label="Delete analysis"
      successMessage="Analysis deleted"
      onDeleted={() => router.push("/dashboard/ats-analyzer/history")}
    />
  );
}

import type { Metadata } from "next";
import { FileCheck2 } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "ATS Analyzer" };

export default function AtsAnalyzerPage() {
  return (
    <ComingSoon
      icon={FileCheck2}
      title="ATS Analyzer"
      description="Get an instant compatibility score and see exactly how applicant tracking systems parse your resume."
    />
  );
}

import type { Metadata } from "next";

import { AtsSubnav } from "@/components/ats/ats-subnav";

export const metadata: Metadata = { title: "ATS Analyzer" };

export default function AtsAnalyzerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">ATS Resume Analyzer</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          A deterministic, explainable compatibility score against any job description — no AI guesswork, no fake numbers.
        </p>
      </div>
      <AtsSubnav />
      {children}
    </div>
  );
}

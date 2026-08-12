import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { OptimizerSubnav } from "@/components/optimizer/optimizer-subnav";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { isAIProviderConfigured } from "@/lib/ai/provider";

export const metadata: Metadata = { title: "Resume Optimizer" };

export default function ResumeOptimizerLayout({ children }: { children: React.ReactNode }) {
  const configured = isAIProviderConfigured();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">AI Resume Optimizer</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Rewrite your resume to better match a job description — grounded only in what&apos;s already true in your
          resume, re-scored with the same deterministic ATS engine used in the ATS Analyzer.
        </p>
      </div>
      {!configured && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>AI provider not configured</AlertTitle>
          <AlertDescription>
            Set <code>AI_PROVIDER</code> and <code>AI_API_KEY</code> in your environment to enable optimization. The
            rest of JobPilot (dashboard, ATS Analyzer) works fine without it.
          </AlertDescription>
        </Alert>
      )}
      <OptimizerSubnav />
      {children}
    </div>
  );
}

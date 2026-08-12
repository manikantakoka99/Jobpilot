import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { CoverLetterSubnav } from "@/components/cover-letter/cover-letter-subnav";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { isAIProviderConfigured } from "@/lib/ai/provider";

export const metadata: Metadata = { title: "Cover Letter" };

export default function CoverLetterLayout({ children }: { children: React.ReactNode }) {
  const configured = isAIProviderConfigured();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cover Letter Generator</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Generate a cover letter grounded only in your resume, the job description, and your profile — nothing
          invented.
        </p>
      </div>
      {!configured && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>AI provider not configured</AlertTitle>
          <AlertDescription>
            Set <code>AI_PROVIDER</code> and <code>AI_API_KEY</code> in your environment to enable generation. The
            rest of JobPilot (dashboard, ATS Analyzer) works fine without it.
          </AlertDescription>
        </Alert>
      )}
      <CoverLetterSubnav />
      {children}
    </div>
  );
}

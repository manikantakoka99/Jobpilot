import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { InterviewSubnav } from "@/components/interview/interview-subnav";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { isAIProviderConfigured } from "@/lib/ai/provider";

export const metadata: Metadata = { title: "Interview Prep" };

export default function InterviewPrepLayout({ children }: { children: React.ReactNode }) {
  const configured = isAIProviderConfigured();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Interview Prep</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Practice with role-specific interview questions — technical questions are grounded only in your real resume
          and the job description, behavioral questions use common STAR-style patterns. Get feedback after every
          answer, then a final score when you finish.
        </p>
      </div>
      {!configured && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>AI provider not configured</AlertTitle>
          <AlertDescription>
            Set <code>AI_PROVIDER</code> and <code>AI_API_KEY</code> in your environment to enable Interview Prep. The
            rest of JobPilot works fine without it.
          </AlertDescription>
        </Alert>
      )}
      <InterviewSubnav />
      {children}
    </div>
  );
}

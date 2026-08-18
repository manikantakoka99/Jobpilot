import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { isAIProviderConfigured } from "@/lib/ai/provider";

export const metadata: Metadata = { title: "Career Assistant" };

export default function CareerAssistantLayout({ children }: { children: React.ReactNode }) {
  const configured = isAIProviderConfigured();

  return (
    <div className="flex flex-col space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Career Assistant</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Ask about your own JobPilot data — applications, ATS scores, resume versions, interview history. Answers are
          grounded only in your real data; suggestions are always labeled as suggestions, never stated as fact.
        </p>
      </div>
      {!configured && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>AI provider not configured</AlertTitle>
          <AlertDescription>
            Set <code>AI_PROVIDER</code> and <code>AI_API_KEY</code> in your environment to enable the Career Assistant.
            The rest of JobPilot works fine without it.
          </AlertDescription>
        </Alert>
      )}
      <div className="h-[75vh] min-h-[420px]">{children}</div>
    </div>
  );
}

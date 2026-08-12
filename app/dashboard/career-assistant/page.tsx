import type { Metadata } from "next";
import { Bot } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Career Assistant" };

export default function CareerAssistantPage() {
  return (
    <ComingSoon
      icon={Bot}
      title="Career Assistant"
      description="Chat with an AI assistant for guidance throughout your job search."
    />
  );
}

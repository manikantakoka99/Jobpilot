import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAnalyticsSummary } from "@/services/analytics-service";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const summary = await getAnalyticsSummary(supabase, user.id);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Real metrics derived live from your applications, ATS analyses, resume versions, cover letters, and interview
          sessions — nothing here is stored separately or invented.
        </p>
      </div>
      <AnalyticsDashboard summary={summary} />
    </div>
  );
}

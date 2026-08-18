import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, ClipboardList, MessagesSquare, History, ArrowUpRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { ensureProfile, computeProfileCompletion } from "@/services/profile-service";
import { getAnalyticsSummary } from "@/services/analytics-service";
import { listApplications } from "@/services/application-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileCompletionCard } from "@/components/dashboard/profile-completion-card";
import { LiveStatCard } from "@/components/dashboard/live-stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Layout guarantees `user` exists; narrow for TypeScript.
  const profile = user ? await ensureProfile(supabase, user) : null;
  const completion = profile ? computeProfileCompletion(profile) : 0;
  const firstName = profile?.full_name?.split(" ")[0];

  const [summary, applications] = user
    ? await Promise.all([getAnalyticsSummary(supabase, user.id), listApplications(supabase, user.id)])
    : [null, []];
  const recentApplications = applications.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ""} 👋
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">Here&apos;s a snapshot of your job search.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileCompletionCard completion={completion} />
        <LiveStatCard
          icon={FileCheck2}
          label="Avg ATS score"
          value={summary?.avgAtsScore == null ? "—" : String(summary.avgAtsScore)}
          hint={summary?.avgAtsScore == null ? "Run your first analysis" : "Across all analyses"}
          href="/dashboard/ats-analyzer"
        />
        <LiveStatCard
          icon={ClipboardList}
          label="Applications"
          value={summary ? String(summary.totalApplications) : "—"}
          hint={summary ? `${summary.weeklyApplications} this week` : "No data yet"}
          href="/dashboard/applications"
        />
        <LiveStatCard
          icon={MessagesSquare}
          label="Interviews"
          value={summary ? String(summary.interviewsCount) : "—"}
          hint={summary ? `${summary.offersCount} offers` : "No data yet"}
          href="/dashboard/interview-prep"
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Quick actions</h3>
        <QuickActions />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent activity</CardTitle>
          {recentApplications.length > 0 && (
            <Link href="/dashboard/applications" className="text-primary flex items-center gap-1 text-xs font-medium">
              View all <ArrowUpRight className="size-3" />
            </Link>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {recentApplications.length === 0 ? (
            <EmptyState
              icon={History}
              title="No activity yet"
              description="Once you start using JobPilot AI, your recent applications will show up here."
            />
          ) : (
            <div className="divide-border divide-y px-4">
              {recentApplications.map((a) => (
                <Link
                  key={a.id}
                  href="/dashboard/applications"
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {a.job_title} <span className="text-muted-foreground font-normal">@ {a.company}</span>
                    </p>
                    <p className="text-muted-foreground text-xs">{formatDateTime(a.created_at)}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {a.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

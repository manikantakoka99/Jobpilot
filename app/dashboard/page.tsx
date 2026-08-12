import type { Metadata } from "next";
import { FileCheck2, ClipboardList, MessagesSquare, History } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { ensureProfile, computeProfileCompletion } from "@/services/profile-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileCompletionCard } from "@/components/dashboard/profile-completion-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { EmptyState } from "@/components/dashboard/empty-state";

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ""} 👋
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Here&apos;s a snapshot of your job search. More tools are on the way.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProfileCompletionCard completion={completion} />
        <StatCard
          icon={FileCheck2}
          label="ATS Score"
          value="—"
          hint="Available in a future phase"
          href="/dashboard/ats-analyzer"
        />
        <StatCard
          icon={ClipboardList}
          label="Applications"
          value="—"
          hint="Available in a future phase"
          href="/dashboard/applications"
        />
        <StatCard
          icon={MessagesSquare}
          label="Interviews"
          value="—"
          hint="Available in a future phase"
          href="/dashboard/interview-prep"
        />
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Quick actions</h3>
        <QuickActions />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EmptyState
            icon={History}
            title="No activity yet"
            description="Once you start using JobPilot AI, your recent actions will show up here."
          />
        </CardContent>
      </Card>
    </div>
  );
}

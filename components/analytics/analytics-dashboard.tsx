"use client";

import { ClipboardList, CalendarDays, CalendarRange, MessagesSquare, Trophy, XCircle, FileCheck2, FileEdit, Mail } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MetricCard } from "@/components/analytics/metric-card";
import {
  ApplicationsOverTimeChart,
  StatusDistributionChart,
  AtsScoreTrendChart,
  InterviewConversionChart,
  FunnelChart,
} from "@/components/analytics/charts";
import type { AnalyticsSummary } from "@/services/analytics-service";

export function AnalyticsDashboard({ summary }: { summary: AnalyticsSummary }) {
  if (!summary.hasAnyData) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardList}
          title="No activity yet"
          description="Analyze a resume, save a job, log an application, or run an interview session — your real metrics and charts will show up here as you go. Nothing here is ever a placeholder number."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={ClipboardList} label="Total applications" value={String(summary.totalApplications)} />
        <MetricCard icon={CalendarDays} label="This week" value={String(summary.weeklyApplications)} hint="Applications logged" />
        <MetricCard icon={CalendarRange} label="This month" value={String(summary.monthlyApplications)} hint="Applications logged" />
        <MetricCard
          icon={XCircle}
          label="Rejection rate"
          value={summary.rejectionRate == null ? "—" : `${summary.rejectionRate}%`}
        />
        <MetricCard icon={MessagesSquare} label="Interview-stage applications" value={String(summary.interviewsCount)} />
        <MetricCard icon={Trophy} label="Offers" value={String(summary.offersCount)} />
        <MetricCard
          icon={FileCheck2}
          label="Avg ATS score"
          value={summary.avgAtsScore == null ? "—" : String(summary.avgAtsScore)}
          hint={summary.avgAtsScore == null ? "No analyses yet" : "Across all ATS analyses"}
        />
        <MetricCard icon={FileEdit} label="Optimized resumes" value={String(summary.optimizedResumesCount)} />
        <MetricCard icon={Mail} label="Cover letters" value={String(summary.coverLettersCount)} />
        <MetricCard
          icon={MessagesSquare}
          label="Mock interview sessions"
          value={String(summary.interviewSessionsCount)}
          hint={`${summary.completedInterviewSessions} completed`}
        />
        <MetricCard
          icon={Trophy}
          label="Avg mock interview score"
          value={summary.avgInterviewScore == null ? "—" : String(summary.avgInterviewScore)}
          hint={summary.avgInterviewScore == null ? "No completed sessions yet" : "Across completed sessions"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications over time</CardTitle>
            <CardDescription>Daily applications logged, last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationsOverTimeChart data={summary.applicationsOverTime} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status distribution</CardTitle>
            <CardDescription>Where your applications currently stand.</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDistributionChart data={summary.statusDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ATS score trend</CardTitle>
            <CardDescription>Your last {summary.atsScoreTrend.length} ATS analyses, in order.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.atsScoreTrend.length === 0 ? (
              <EmptyState icon={FileCheck2} title="No ATS analyses yet" description="Run an ATS analysis to start tracking your score over time." />
            ) : (
              <AtsScoreTrendChart data={summary.atsScoreTrend} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interview conversion</CardTitle>
            <CardDescription>Applied → Interview → Offer, current counts.</CardDescription>
          </CardHeader>
          <CardContent>
            <InterviewConversionChart data={summary.interviewConversion} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Application funnel</CardTitle>
            <CardDescription>How many applications currently sit at each pipeline stage (excludes Rejected/Withdrawn).</CardDescription>
          </CardHeader>
          <CardContent>
            <FunnelChart data={summary.funnel} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

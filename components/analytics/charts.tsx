"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

import type { AnalyticsSummary } from "@/services/analytics-service";

const AXIS_PROPS = {
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: "var(--border)" },
} as const;

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-md)",
    fontSize: 12,
  },
} as const;

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ApplicationsOverTimeChart({ data }: { data: AnalyticsSummary["applicationsOverTime"] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatShortDate} interval={4} {...AXIS_PROPS} />
        <YAxis allowDecimals={false} {...AXIS_PROPS} />
        <Tooltip {...TOOLTIP_STYLE} labelFormatter={(v) => formatShortDate(String(v))} />
        <Line type="monotone" dataKey="count" name="Applications" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Saved: "var(--chart-5)",
  Preparing: "var(--chart-3)",
  Applied: "var(--chart-1)",
  Screening: "var(--chart-1)",
  Interview: "var(--chart-2)",
  Offer: "var(--chart-2)",
  Rejected: "var(--chart-4)",
  Withdrawn: "var(--muted-foreground)",
};

export function StatusDistributionChart({ data }: { data: AnalyticsSummary["statusDistribution"] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="status" {...AXIS_PROPS} />
        <YAxis allowDecimals={false} {...AXIS_PROPS} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="count" name="Applications" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "var(--chart-1)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AtsScoreTrendChart({ data }: { data: AnalyticsSummary["atsScoreTrend"] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatShortDate} {...AXIS_PROPS} />
        <YAxis domain={[0, 100]} {...AXIS_PROPS} />
        <Tooltip {...TOOLTIP_STYLE} labelFormatter={(v) => formatShortDate(String(v))} />
        <Line type="monotone" dataKey="score" name="ATS score" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function InterviewConversionChart({ data }: { data: AnalyticsSummary["interviewConversion"] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
        <YAxis type="category" dataKey="stage" width={70} {...AXIS_PROPS} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="count" name="Applications" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FunnelChart({ data }: { data: AnalyticsSummary["funnel"] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
        <YAxis type="category" dataKey="stage" width={70} {...AXIS_PROPS} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Bar dataKey="count" name="Applications" fill="var(--chart-5)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import { motion } from "framer-motion";
import { FileCheck2, Sparkles, Briefcase, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";

const STATS = [
  { label: "ATS Score", value: "87", suffix: "/100", icon: FileCheck2, tone: "text-success" },
  { label: "Applications", value: "24", suffix: "", icon: Briefcase, tone: "text-primary" },
  { label: "Interviews", value: "5", suffix: "", icon: TrendingUp, tone: "text-warning" },
];

/**
 * A static, illustrative preview of the dashboard — not real data. Used
 * purely to visually anchor the hero section.
 */
export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
      className="relative mx-auto mt-16 max-w-4xl"
    >
      <div
        aria-hidden="true"
        className="bg-gradient-brand absolute -inset-6 -z-10 rounded-[2rem] opacity-20 blur-3xl"
      />
      <Card className="border-border/60 overflow-hidden rounded-2xl p-0 shadow-2xl shadow-black/[0.06] dark:shadow-black/40">
        <div className="border-border/60 bg-muted/40 flex items-center gap-1.5 border-b px-4 py-3">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <span className="text-muted-foreground ml-3 text-xs">app.jobpilot.ai/dashboard</span>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          {STATS.map(({ label, value, suffix, icon: Icon, tone }) => (
            <div key={label} className="border-border/60 bg-card/60 rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-muted-foreground text-xs font-medium">{label}</span>
                <Icon className={`size-4 ${tone}`} />
              </div>
              <p className="text-2xl font-semibold tracking-tight">
                {value}
                <span className="text-muted-foreground text-sm font-normal">{suffix}</span>
              </p>
            </div>
          ))}

          <div className="border-border/60 bg-card/60 col-span-full rounded-xl border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="text-primary size-4" />
              <span className="text-sm font-medium">Recommended next step</span>
            </div>
            <div className="bg-muted/60 h-2 w-full overflow-hidden rounded-full">
              <div className="bg-gradient-brand h-full w-2/3 rounded-full" />
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Optimize your resume for the &ldquo;Senior Product Designer&rdquo; role
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

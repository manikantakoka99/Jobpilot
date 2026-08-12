"use client";

import { motion } from "framer-motion";
import {
  FileCheck2,
  FileEdit,
  Mail,
  ClipboardList,
  MessagesSquare,
  Bot,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: FileCheck2,
    title: "ATS Score",
    description: "See exactly how applicant tracking systems read your resume before you apply.",
  },
  {
    icon: FileEdit,
    title: "Resume Optimization",
    description: "Get targeted suggestions to align your resume with any job description.",
  },
  {
    icon: Mail,
    title: "Cover Letters",
    description: "Generate tailored cover letters that match your voice and the role.",
  },
  {
    icon: ClipboardList,
    title: "Application Tracking",
    description: "Keep every application, status, and follow-up organized in one board.",
  },
  {
    icon: MessagesSquare,
    title: "Interview Preparation",
    description: "Practice with role-specific questions and structured feedback.",
  },
  {
    icon: Bot,
    title: "AI Career Assistant",
    description: "Ask questions and get guidance throughout your entire job search.",
  },
];

export function FeatureCards() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to get hired
        </h2>
        <p className="text-muted-foreground mt-4 text-lg text-pretty">
          A complete toolkit for your job search, built around one connected workspace.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <Card className="group border-border/60 hover:border-primary/30 relative h-full overflow-hidden p-6 transition-colors">
              <div className="bg-primary/10 text-primary mb-4 flex size-11 items-center justify-center rounded-xl">
                <Icon className="size-5" />
              </div>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                <Badge variant="secondary" className="text-[10px] font-medium">
                  Coming soon
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

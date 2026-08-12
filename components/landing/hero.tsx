"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-20 pb-8 sm:px-6 sm:pt-28 lg:px-8">
      <div
        aria-hidden="true"
        className="bg-gradient-brand grid-fade-mask pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-[0.10]"
      />
      <div
        aria-hidden="true"
        className="bg-grid-pattern pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border-border/60 bg-card/60 text-muted-foreground mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm"
        >
          <span className="bg-primary size-1.5 rounded-full" />
          Your AI-powered career copilot
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
        >
          Land Your Dream Job{" "}
          <span className="text-gradient-brand">Faster with AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg text-pretty"
        >
          Optimize your resume, improve ATS compatibility, organize applications, and prepare for
          interviews — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
            <a href="#how-it-works">
              <PlayCircle className="size-4" />
              See How It Works
            </a>
          </Button>
        </motion.div>

        <p className="text-muted-foreground mt-4 text-xs">
          No credit card required · Free to get started
        </p>
      </div>

      <DashboardPreview />
    </section>
  );
}

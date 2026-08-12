"use client";

import { motion } from "framer-motion";
import { Upload, Target, Wand2, TrendingUp } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "Upload your resume",
    description: "Add your existing resume or start fresh from a blank profile.",
  },
  {
    icon: Target,
    title: "Analyze your target job",
    description: "Point JobPilot AI at a role you're targeting to understand what matters most.",
  },
  {
    icon: Wand2,
    title: "Improve your application",
    description: "Apply guided suggestions to strengthen your resume and materials.",
  },
  {
    icon: TrendingUp,
    title: "Track your progress",
    description: "Follow every application from submission to offer in one place.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/30 border-border/60 border-y py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            Four simple steps between you and your next offer.
          </p>
        </div>

        <div className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div
            aria-hidden="true"
            className="via-border absolute top-6 right-0 left-0 hidden h-px bg-gradient-to-r from-transparent to-transparent lg:block"
          />
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative text-center"
            >
              <div className="border-border bg-background text-primary relative z-10 mx-auto mb-5 flex size-12 items-center justify-center rounded-full border shadow-sm">
                <Icon className="size-5" />
              </div>
              <span className="text-muted-foreground/60 text-xs font-semibold tracking-wider">
                STEP {i + 1}
              </span>
              <h3 className="mt-1 font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

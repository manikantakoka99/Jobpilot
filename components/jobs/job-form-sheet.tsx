"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { createJobAction, updateJobAction } from "@/app/dashboard/jobs/actions";
import type { JobRow } from "@/types/database";

interface JobFormSheetProps {
  /** Present when editing an existing job; omitted for "save a new job". */
  job?: JobRow;
  onSaved: (job: { id: string }) => void;
  trigger?: React.ReactNode;
}

const emptyForm = { title: "", company: "", url: "", location: "", salary: "", description: "" };

function toForm(job?: JobRow) {
  if (!job) return emptyForm;
  return {
    title: job.title,
    company: job.company,
    url: job.url ?? "",
    location: job.location ?? "",
    salary: job.salary ?? "",
    description: job.description ?? "",
  };
}

/** Create/edit form for a saved job — a job is always user-entered (pasted/typed), never scraped. */
export function JobFormSheet({ job, onSaved, trigger }: JobFormSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(toForm(job));
  const [isSaving, setIsSaving] = React.useState(false);

  function handleOpenChange(next: boolean) {
    if (next) setForm(toForm(job));
    setOpen(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    if (job) {
      const result = await updateJobAction({ id: job.id, ...form });
      setIsSaving(false);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Job updated");
      setOpen(false);
      onSaved({ id: job.id });
      return;
    }

    const result = await createJobAction(form);
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Job saved");
    setOpen(false);
    onSaved(result.data);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button type="button">
            <Plus className="size-4" /> Save a job
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{job ? "Edit job" : "Save a job"}</SheetTitle>
          <SheetDescription>
            Paste in the details from a job posting. JobPilot never scrapes job boards on your behalf.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="job-title">Job title</Label>
            <Input
              id="job-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-company">Company</Label>
            <Input
              id="job-company"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-url">Job URL</Label>
            <Input
              id="job-url"
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://…"
              maxLength={2000}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-location">Location</Label>
              <Input
                id="job-location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-salary">Salary</Label>
              <Input
                id="job-salary"
                value={form.salary}
                onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                maxLength={100}
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="job-description">Job description</Label>
            <Textarea
              id="job-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="min-h-40 flex-1"
              maxLength={20000}
              placeholder="Paste the job description — used for Analyze Job and Apply Assistant."
            />
          </div>
        </form>
        <SheetFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isSaving || !form.title.trim() || !form.company.trim()}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {job ? "Save changes" : "Save job"}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

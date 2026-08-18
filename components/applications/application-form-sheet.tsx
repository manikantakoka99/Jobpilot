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
import { createApplicationAction, updateApplicationAction } from "@/app/dashboard/applications/actions";
import type { ApplicationRow } from "@/types/database";

interface ApplicationFormSheetProps {
  /** Present when editing an existing application; omitted for "create manually". */
  application?: ApplicationRow;
  onSaved: (application: { id: string }) => void;
  trigger?: React.ReactNode;
}

const emptyForm = { jobTitle: "", company: "", jobUrl: "", location: "", salary: "", notes: "", followUpDate: "" };

function toForm(application?: ApplicationRow) {
  if (!application) return emptyForm;
  return {
    jobTitle: application.job_title,
    company: application.company,
    jobUrl: application.job_url ?? "",
    location: application.location ?? "",
    salary: application.salary ?? "",
    notes: application.notes ?? "",
    followUpDate: application.follow_up_date ?? "",
  };
}

/** Create/edit form for an application's core fields. Status is changed separately (see ApplicationStatusMenu). */
export function ApplicationFormSheet({ application, onSaved, trigger }: ApplicationFormSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState(toForm(application));
  const [isSaving, setIsSaving] = React.useState(false);

  function handleOpenChange(next: boolean) {
    if (next) setForm(toForm(application));
    setOpen(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const payload = { ...form, followUpDate: form.followUpDate || undefined };

    if (application) {
      const result = await updateApplicationAction({ id: application.id, ...payload });
      setIsSaving(false);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Application updated");
      setOpen(false);
      onSaved({ id: application.id });
      return;
    }

    const result = await createApplicationAction(payload);
    setIsSaving(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Application created");
    setOpen(false);
    onSaved(result.data);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button type="button">
            <Plus className="size-4" /> New application
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{application ? "Edit application" : "New application"}</SheetTitle>
          <SheetDescription>Track a job application manually — statuses are updated separately.</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="app-title">Job title</Label>
            <Input
              id="app-title"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="app-company">Company</Label>
            <Input
              id="app-company"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              maxLength={200}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="app-url">Job URL</Label>
            <Input
              id="app-url"
              type="url"
              value={form.jobUrl}
              onChange={(e) => setForm((f) => ({ ...f, jobUrl: e.target.value }))}
              placeholder="https://…"
              maxLength={2000}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="app-location">Location</Label>
              <Input
                id="app-location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="app-salary">Salary</Label>
              <Input
                id="app-salary"
                value={form.salary}
                onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))}
                maxLength={100}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="app-follow-up">Follow-up date</Label>
            <Input
              id="app-follow-up"
              type="date"
              value={form.followUpDate}
              onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="app-notes">Notes</Label>
            <Textarea
              id="app-notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="min-h-32 flex-1"
              maxLength={10000}
            />
          </div>
        </form>
        <SheetFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isSaving || !form.jobTitle.trim() || !form.company.trim()}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
            {application ? "Save changes" : "Create application"}
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

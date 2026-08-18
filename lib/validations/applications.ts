import { z } from "zod";

/** Kanban columns, in board order — see components/applications/application-board.tsx. */
export const APPLICATION_STATUSES = [
  "Saved",
  "Preparing",
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

const MAX_TITLE_LENGTH = 200;
const MAX_COMPANY_LENGTH = 200;
const MAX_LOCATION_LENGTH = 200;
const MAX_SALARY_LENGTH = 100;
const MAX_URL_LENGTH = 2000;
const MAX_NOTES_LENGTH = 10000;
const MAX_SOURCE_LENGTH = 50;

const optionalUrl = z.union([z.literal(""), z.url("Enter a valid URL.").max(MAX_URL_LENGTH, "URL is too long.")]).optional();

/** Input for creating an application — either from scratch or pre-filled from a saved job (see createApplicationFromJobAction). */
export const createApplicationSchema = z.object({
  jobId: z.uuid().optional(),
  jobTitle: z.string().trim().min(1, "Job title is required.").max(MAX_TITLE_LENGTH, "Job title is too long."),
  company: z.string().trim().min(1, "Company is required.").max(MAX_COMPANY_LENGTH, "Company name is too long."),
  jobUrl: optionalUrl,
  location: z.string().trim().max(MAX_LOCATION_LENGTH, "Location is too long.").optional(),
  salary: z.string().trim().max(MAX_SALARY_LENGTH, "Salary is too long.").optional(),
  status: applicationStatusSchema.optional(),
  source: z.string().trim().max(MAX_SOURCE_LENGTH).optional(),
  resumeId: z.uuid().optional(),
  resumeVersionId: z.uuid().optional(),
  coverLetterId: z.uuid().optional(),
  notes: z.string().trim().max(MAX_NOTES_LENGTH, "Notes are too long.").optional(),
  followUpDate: z.iso.date().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

/** Input for editing an application's core fields — status changes go through updateApplicationStatusSchema instead. */
export const updateApplicationSchema = z.object({
  id: z.uuid(),
  jobTitle: z.string().trim().min(1, "Job title is required.").max(MAX_TITLE_LENGTH, "Job title is too long."),
  company: z.string().trim().min(1, "Company is required.").max(MAX_COMPANY_LENGTH, "Company name is too long."),
  jobUrl: optionalUrl,
  location: z.string().trim().max(MAX_LOCATION_LENGTH, "Location is too long.").optional(),
  salary: z.string().trim().max(MAX_SALARY_LENGTH, "Salary is too long.").optional(),
  resumeId: z.uuid().nullable().optional(),
  resumeVersionId: z.uuid().nullable().optional(),
  coverLetterId: z.uuid().nullable().optional(),
  notes: z.string().trim().max(MAX_NOTES_LENGTH, "Notes are too long.").optional(),
  followUpDate: z.iso.date().nullable().optional(),
});

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

export const updateApplicationStatusSchema = z.object({
  id: z.uuid(),
  status: applicationStatusSchema,
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

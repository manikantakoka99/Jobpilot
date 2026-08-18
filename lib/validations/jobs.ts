import { z } from "zod";

const MAX_TITLE_LENGTH = 200;
const MAX_COMPANY_LENGTH = 200;
const MAX_LOCATION_LENGTH = 200;
const MAX_SALARY_LENGTH = 100;
const MAX_URL_LENGTH = 2000;
const MAX_DESCRIPTION_LENGTH = 20000;
const MAX_SOURCE_LENGTH = 50;

/** Input for saving a job. Jobs are always user-entered (pasted/typed) — never scraped on the user's behalf. */
export const createJobSchema = z.object({
  title: z.string().trim().min(1, "Job title is required.").max(MAX_TITLE_LENGTH, "Job title is too long."),
  company: z.string().trim().min(1, "Company is required.").max(MAX_COMPANY_LENGTH, "Company name is too long."),
  url: z.union([z.literal(""), z.url("Enter a valid URL.").max(MAX_URL_LENGTH, "URL is too long.")]).optional(),
  location: z.string().trim().max(MAX_LOCATION_LENGTH, "Location is too long.").optional(),
  description: z.string().trim().max(MAX_DESCRIPTION_LENGTH, "Description is too long.").optional(),
  salary: z.string().trim().max(MAX_SALARY_LENGTH, "Salary is too long.").optional(),
  source: z.string().trim().max(MAX_SOURCE_LENGTH).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = createJobSchema.extend({
  id: z.uuid(),
});

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

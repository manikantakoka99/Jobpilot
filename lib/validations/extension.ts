import { z } from "zod";

export const screeningSuggestionSchema = z.object({
  question: z.string().trim().min(1, "Question is required.").max(2000, "Question is too long."),
  resumeId: z.uuid().optional(),
  resumeVersionId: z.uuid().optional(),
});

export type ScreeningSuggestionInput = z.infer<typeof screeningSuggestionSchema>;

export const markAppliedSchema = z.object({
  applicationId: z.uuid(),
});

export type MarkAppliedInput = z.infer<typeof markAppliedSchema>;

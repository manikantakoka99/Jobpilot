import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(300, "URL is too long")
  .refine((val) => val === "" || /^https?:\/\/.+/i.test(val), {
    message: "Enter a full URL starting with https://",
  })
  .optional()
  .or(z.literal(""));

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  phone: z.string().trim().max(30, "Phone number is too long").optional().or(z.literal("")),
  location: z.string().trim().max(100, "Location is too long").optional().or(z.literal("")),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  portfolioUrl: optionalUrl,
});

export type ProfileFormInput = z.infer<typeof profileSchema>;

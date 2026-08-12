"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Phone, MapPin, Briefcase, Code2, Globe } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/services/profile-service";
import { profileSchema, type ProfileFormInput } from "@/lib/validations/profile";
import { fieldErrors } from "@/lib/validations/utils";
import { AvatarUploader } from "@/components/dashboard/avatar-uploader";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = React.useState(profile.avatar_url);
  const [values, setValues] = React.useState<ProfileFormInput>({
    fullName: profile.full_name ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    linkedinUrl: profile.linkedin_url ?? "",
    githubUrl: profile.github_url ?? "",
    portfolioUrl: profile.portfolio_url ?? "",
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function update<K extends keyof ProfileFormInput>(key: K, value: ProfileFormInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = profileSchema.safeParse(values);
    if (!result.success) {
      setErrors(fieldErrors(result.error as z.ZodError));
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      await updateProfile(supabase, profile.id, {
        full_name: result.data.fullName,
        phone: result.data.phone || null,
        location: result.data.location || null,
        linkedin_url: result.data.linkedinUrl || null,
        github_url: result.data.githubUrl || null,
        portfolio_url: result.data.portfolioUrl || null,
      });
      toast.success("Profile updated");
      router.refresh();
    } catch {
      toast.error("Couldn't save your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <AvatarUploader
        userId={profile.id}
        displayName={values.fullName || profile.email}
        avatarUrl={avatarUrl}
        onUploaded={setAvatarUrl}
      />

      <Separator />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            value={values.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && <p className="text-destructive text-xs">{errors.fullName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.email} disabled readOnly />
          <p className="text-muted-foreground text-xs">Managed via your account settings.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <div className="relative">
            <Phone className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              className="pl-9"
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
              aria-invalid={!!errors.phone}
            />
          </div>
          {errors.phone && <p className="text-destructive text-xs">{errors.phone}</p>}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="location">Location</Label>
          <div className="relative">
            <MapPin className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="location"
              placeholder="San Francisco, CA"
              className="pl-9"
              value={values.location}
              onChange={(e) => update("location", e.target.value)}
              aria-invalid={!!errors.location}
            />
          </div>
          {errors.location && <p className="text-destructive text-xs">{errors.location}</p>}
        </div>
      </div>

      <Separator />

      <div className="space-y-5">
        <p className="text-sm font-medium">Links</p>

        <div className="space-y-2">
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
          <div className="relative">
            <Briefcase className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="linkedinUrl"
              placeholder="https://linkedin.com/in/username"
              className="pl-9"
              value={values.linkedinUrl}
              onChange={(e) => update("linkedinUrl", e.target.value)}
              aria-invalid={!!errors.linkedinUrl}
            />
          </div>
          {errors.linkedinUrl && <p className="text-destructive text-xs">{errors.linkedinUrl}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="githubUrl">GitHub URL</Label>
          <div className="relative">
            <Code2 className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="githubUrl"
              placeholder="https://github.com/username"
              className="pl-9"
              value={values.githubUrl}
              onChange={(e) => update("githubUrl", e.target.value)}
              aria-invalid={!!errors.githubUrl}
            />
          </div>
          {errors.githubUrl && <p className="text-destructive text-xs">{errors.githubUrl}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="portfolioUrl">Portfolio URL</Label>
          <div className="relative">
            <Globe className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="portfolioUrl"
              placeholder="https://yourname.dev"
              className="pl-9"
              value={values.portfolioUrl}
              onChange={(e) => update("portfolioUrl", e.target.value)}
              aria-invalid={!!errors.portfolioUrl}
            />
          </div>
          {errors.portfolioUrl && <p className="text-destructive text-xs">{errors.portfolioUrl}</p>}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </Button>
      </div>
    </form>
  );
}

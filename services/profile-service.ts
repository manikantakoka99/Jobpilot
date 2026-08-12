import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database, Profile, ProfileUpdate } from "@/types/database";

type Client = SupabaseClient<Database>;

/**
 * Fetches the current user's profile row.
 * Returns `null` if it doesn't exist yet (e.g. the signup trigger hasn't
 * run, or the row was created before this schema existed).
 */
export async function getProfile(
  supabase: Client,
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Fetches the current user's profile, lazily creating it if it's missing.
 * This is a safety net for edge cases such as an interrupted signup or the
 * database trigger failing to run — the app should never get stuck because
 * a profile row doesn't exist.
 */
export async function ensureProfile(
  supabase: Client,
  user: User,
): Promise<Profile> {
  const existing = await getProfile(supabase, user.id);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
        avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  supabase: Client,
  userId: string,
  updates: ProfileUpdate,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

const COMPLETION_FIELDS: (keyof Profile)[] = [
  "full_name",
  "avatar_url",
  "phone",
  "location",
  "linkedin_url",
  "github_url",
  "portfolio_url",
];

/** Percentage (0–100) of optional profile fields that have been filled in. */
export function computeProfileCompletion(profile: Profile): number {
  const filled = COMPLETION_FIELDS.filter((field) => Boolean(profile[field])).length;
  return Math.round((filled / COMPLETION_FIELDS.length) * 100);
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB — generous for the free tier
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Uploads a new avatar image to the `avatars` storage bucket under the
 * user's own folder (required by the storage RLS policies) and returns its
 * public URL.
 */
export async function uploadAvatar(
  supabase: Client,
  userId: string,
  file: File,
): Promise<string> {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    throw new Error("Please upload a PNG, JPEG, or WebP image.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Image must be smaller than 5MB.");
  }

  const extension = file.name.split(".").pop() ?? "png";
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  return publicUrl;
}

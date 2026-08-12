"use client";

import * as React from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { uploadAvatar, updateProfile } from "@/services/profile-service";
import { getInitials } from "@/lib/format";

interface AvatarUploaderProps {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  onUploaded?: (url: string) => void;
}

export function AvatarUploader({ userId, displayName, avatarUrl, onUploaded }: AvatarUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState(avatarUrl);
  const [isUploading, setIsUploading] = React.useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploading(true);
    try {
      const supabase = createClient();
      const url = await uploadAvatar(supabase, userId, file);
      await updateProfile(supabase, userId, { avatar_url: url });
      setPreview(url);
      onUploaded?.(url);
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="size-16">
          <AvatarImage src={preview ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        {isUploading && (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center rounded-full">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="border-border hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <Camera className="size-3.5" />
          Change photo
        </button>
        <p className="text-muted-foreground mt-1.5 text-xs">PNG, JPEG or WebP. Max 5MB.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Upload profile photo"
        />
      </div>
    </div>
  );
}

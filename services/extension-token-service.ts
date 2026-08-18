import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, ExtensionTokenRow } from "@/types/database";
import { generateToken, hashToken } from "@/lib/extension/tokens";

type Client = SupabaseClient<Database>;

export class ExtensionTokenServiceError extends Error {}

const TOKEN_LIFETIME_DAYS = 90;

export interface ExtensionTokenSummary {
  id: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
}

function toSummary(row: ExtensionTokenRow): ExtensionTokenSummary {
  return { id: row.id, label: row.label, createdAt: row.created_at, lastUsedAt: row.last_used_at, expiresAt: row.expires_at };
}

/** Never returns rows that have been (soft- or hard-) revoked — see 0006_extension_tokens.sql for why deletion is the revoke mechanism. */
export async function listExtensionTokens(supabase: Client, userId: string): Promise<ExtensionTokenSummary[]> {
  const { data, error } = await supabase
    .from("extension_tokens")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toSummary);
}

/**
 * Creates a new token and returns its raw value exactly once — only the
 * hash is persisted. The caller (a Server Action reached via the normal
 * cookie-authenticated session) must show `token` to the user immediately
 * and never log or store it elsewhere.
 */
export async function createExtensionToken(
  supabase: Client,
  userId: string,
  label: string,
): Promise<{ token: string; summary: ExtensionTokenSummary }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("extension_tokens")
    .insert({ user_id: userId, token_hash: hashToken(token), label: label.trim() || "Chrome Extension", expires_at: expiresAt })
    .select("*")
    .single();

  if (error) throw new ExtensionTokenServiceError("Failed to create extension token. Please try again.");
  return { token, summary: toSummary(data) };
}

/** Hard delete — the chosen "revoke" mechanism (see 0006_extension_tokens.sql; there is no update/soft-revoke policy). */
export async function revokeExtensionToken(supabase: Client, userId: string, id: string): Promise<void> {
  const { error } = await supabase.from("extension_tokens").delete().eq("id", id).eq("user_id", userId);
  if (error) throw new ExtensionTokenServiceError("Failed to revoke token. Please try again.");
}

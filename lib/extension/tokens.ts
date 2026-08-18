import { randomBytes, createHash } from "node:crypto";

/** Prefix makes tokens recognizable in logs/UI without revealing anything secret (same idea as `ghp_`, `sk-`, etc). */
const TOKEN_PREFIX = "jbpt_";

/**
 * Generates a new raw extension token. Callers must show this to the user
 * exactly once and store only its hash (see hashToken) — the raw value is
 * never persisted.
 */
export function generateToken(): string {
  return `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

/** Deterministic, one-way — used both to store a new token and to look up an incoming bearer token. */
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

/** Extracts the bearer token from an `Authorization: Bearer <token>` header, or null if missing/malformed. */
export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(authorizationHeader.trim());
  return match ? match[1] : null;
}

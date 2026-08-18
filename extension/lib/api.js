// Shared API client for talking to the JobPilot web app's extension routes
// (app/api/extension/*). Every function here only ever reads data or, for
// mark-applied, records an event the user explicitly confirmed — nothing in
// this file fills a form or submits anything by itself.

export const DEFAULT_API_BASE = "http://localhost:3000";
/** Production JobPilot deployment — offered as a one-click option in the pairing form (see popup.js). */
export const PRODUCTION_API_BASE = "https://jobpilot-tan-chi.vercel.app";

const STORAGE_KEY = "jobpilot_extension_settings";

/** { token: string, apiBase: string } | null */
export async function getSettings() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return stored[STORAGE_KEY] ?? null;
}

export async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

export async function clearSettings() {
  await chrome.storage.local.remove(STORAGE_KEY);
}

class ApiError extends Error {}

async function apiFetch(path, options = {}) {
  const settings = await getSettings();
  if (!settings?.token) {
    throw new ApiError("Not connected. Paste your JobPilot access token first.");
  }

  const apiBase = settings.apiBase || DEFAULT_API_BASE;
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${settings.token}`,
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(body?.error || `Request failed (${response.status}).`);
  }
  return body;
}

/** Profile + document list used to build field suggestions. */
export function fetchMe() {
  return apiFetch("/api/extension/me");
}

/** Tracked applications, for the "which application is this?" picker. */
export function fetchApplications() {
  return apiFetch("/api/extension/applications");
}

/** Deterministic, evidence-based suggestion for one screening question. Never a submitted answer. */
export function fetchScreeningSuggestion({ question, resumeId, resumeVersionId }) {
  return apiFetch("/api/extension/screening-suggestion", {
    method: "POST",
    body: JSON.stringify({ question, resumeId, resumeVersionId }),
  });
}

/** Only ever called after the user explicitly clicks "I submitted this application". */
export function markApplied(applicationId) {
  return apiFetch("/api/extension/mark-applied", {
    method: "POST",
    body: JSON.stringify({ applicationId }),
  });
}

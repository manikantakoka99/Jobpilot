/**
 * Token-budget helpers for the Groq provider (see lib/ai/provider.ts).
 *
 * Groq's SDK doesn't expose a client-side tokenizer, so there's no exact way
 * to count tokens before sending a request. Rather than a flat character
 * limit disconnected from the model's real capacity, this uses a documented
 * approximation checked against the ACTUAL prompt text about to be sent:
 *
 *   ~4 characters per token for English prose — the commonly-cited rule of
 *   thumb for BPE tokenizers on Latin-script text (real ratios vary
 *   ~3-4.5 depending on punctuation/vocabulary density). We round UP
 *   (Math.ceil), so this slightly OVER-counts tokens and stays conservative
 *   rather than optimistic.
 *
 * Model limit below was verified directly against Groq's live models list
 * for the current default, openai/gpt-oss-120b: context_window = 131,072
 * tokens (same value the prior default, llama-3.3-70b-versatile, had — no
 * change needed when that model was retired and swapped out). If AI_MODEL
 * is overridden to a different model this number may not hold exactly, but
 * it's still a reasonable conservative default rather than an arbitrary
 * guess.
 */
const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/** Verified via Groq's models API for openai/gpt-oss-120b — see file header comment. */
export const MODEL_CONTEXT_WINDOW_TOKENS = 131_072;

/**
 * Fraction of the context window deliberately left unused, on top of the
 * output reservation, as headroom for our own estimation error and any
 * Groq-side formatting overhead (role markers, message framing) that isn't
 * visible to us client-side.
 */
const SAFETY_MARGIN_RATIO = 0.15;

export interface PromptBudgetResult {
  ok: boolean;
  estimatedPromptTokens: number;
  limitTokens: number;
}

/**
 * Checks a fully-built system+user prompt pair against the model's real
 * context window, reserving room for the completion itself. Callers should
 * pass the ACTUAL strings about to be sent (after prompt templates, ATS
 * context, and profile lines are all assembled) so nothing is missed —
 * this measures the real request, not a guessed component budget.
 */
export function checkPromptBudget(systemPrompt: string, userPrompt: string, outputReserveTokens: number): PromptBudgetResult {
  const estimatedPromptTokens = estimateTokens(systemPrompt) + estimateTokens(userPrompt);
  const safetyMarginTokens = Math.ceil(MODEL_CONTEXT_WINDOW_TOKENS * SAFETY_MARGIN_RATIO);
  const limitTokens = MODEL_CONTEXT_WINDOW_TOKENS - outputReserveTokens - safetyMarginTokens;
  return { ok: estimatedPromptTokens <= limitTokens, estimatedPromptTokens, limitTokens };
}

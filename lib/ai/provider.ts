import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import { optimizeResumeOutputSchema, generateCoverLetterOutputSchema } from "@/lib/validations/ai-output";
import {
  buildOptimizeResumeSystemPrompt,
  buildOptimizeResumeUserPrompt,
  buildCoverLetterSystemPrompt,
  buildCoverLetterUserPrompt,
} from "./prompts";
import {
  AIProviderNotConfiguredError,
  AIAuthenticationError,
  AIRateLimitError,
  AITimeoutError,
  AIProviderUnavailableError,
  AIContentTooLargeError,
  AIOutputValidationError,
  AIUnexpectedError,
} from "./errors";
import type {
  AIProvider,
  OptimizeResumeInput,
  GenerateCoverLetterInput,
  OptimizeResumeOutput,
  GenerateCoverLetterOutput,
} from "./types";

/**
 * Cost-conscious default: Claude Sonnet is a strong fit for resume/cover
 * letter rewriting at a fraction of Opus's per-token cost, which matters for
 * a free-tier-friendly app where the *user* supplies their own API key.
 * Override with the AI_MODEL env var (e.g. to use Opus) without code changes.
 */
const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_OUTPUT_TOKENS = 4096;

/**
 * Translates Anthropic SDK errors into the app's provider-neutral
 * AIProviderError hierarchy. Never lets a raw SDK error or stack trace reach
 * a Server Action result — see the toSafeMessage() callers in each actions.ts file.
 */
function toAIProviderError(error: unknown): Error {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return new AIAuthenticationError();
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new AIRateLimitError();
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return new AITimeoutError();
  }
  if (error instanceof Anthropic.BadRequestError) {
    // Most commonly an oversized request (too many input tokens).
    return new AIContentTooLargeError();
  }
  if (error instanceof Anthropic.InternalServerError || error instanceof Anthropic.APIConnectionError) {
    return new AIProviderUnavailableError();
  }
  if (error instanceof Anthropic.APIError) {
    return new AIUnexpectedError();
  }
  // Thrown by zodOutputFormat().parse() when the model's JSON doesn't match
  // the schema (malformed or suspicious output) — never inserted into the DB.
  if (error instanceof Anthropic.AnthropicError) {
    return new AIOutputValidationError();
  }
  return new AIUnexpectedError();
}

class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async optimizeResume(input: OptimizeResumeInput): Promise<OptimizeResumeOutput> {
    try {
      const message = await this.client.messages.parse({
        model: this.model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: buildOptimizeResumeSystemPrompt(),
        messages: [{ role: "user", content: buildOptimizeResumeUserPrompt(input) }],
        output_config: { format: zodOutputFormat(optimizeResumeOutputSchema) },
      });
      if (!message.parsed_output) throw new AIOutputValidationError();
      return message.parsed_output;
    } catch (error) {
      if (error instanceof AIOutputValidationError) throw error;
      throw toAIProviderError(error);
    }
  }

  async generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput> {
    try {
      const message = await this.client.messages.parse({
        model: this.model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system: buildCoverLetterSystemPrompt(),
        messages: [{ role: "user", content: buildCoverLetterUserPrompt(input) }],
        output_config: { format: zodOutputFormat(generateCoverLetterOutputSchema) },
      });
      if (!message.parsed_output) throw new AIOutputValidationError();
      return message.parsed_output;
    } catch (error) {
      if (error instanceof AIOutputValidationError) throw error;
      throw toAIProviderError(error);
    }
  }
}

let cachedProvider: AIProvider | null | undefined;

/**
 * Returns the configured AI provider, or `null` if none is configured.
 * Reads `AI_PROVIDER` + `AI_API_KEY` (+ optional `AI_MODEL`) — see
 * .env.example. Currently only `AI_PROVIDER=anthropic` is implemented;
 * anything else (or a missing key) returns `null` so callers can show a
 * clear "not configured" state instead of a fake result.
 *
 * Cached per server process/cold start — env vars don't change at runtime.
 */
export function getAIProvider(): AIProvider | null {
  if (cachedProvider !== undefined) return cachedProvider;

  const providerName = process.env.AI_PROVIDER?.trim().toLowerCase();
  const apiKey = process.env.AI_API_KEY?.trim();

  if (!providerName || !apiKey) {
    cachedProvider = null;
    return cachedProvider;
  }

  if (providerName === "anthropic") {
    const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
    cachedProvider = new AnthropicProvider(apiKey, model);
    return cachedProvider;
  }

  cachedProvider = null;
  return cachedProvider;
}

/** Throws AIProviderNotConfiguredError if no provider is configured. Call at the top of any AI-calling service function. */
export function requireAIProvider(): AIProvider {
  const provider = getAIProvider();
  if (!provider) throw new AIProviderNotConfiguredError();
  return provider;
}

/** Non-throwing check for Server Components that need to render a "not configured" banner up front, before any submit attempt. */
export function isAIProviderConfigured(): boolean {
  return getAIProvider() !== null;
}

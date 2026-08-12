import Groq from "groq-sdk";
import { z } from "zod";

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
 * Free-tier default: Llama 3.3 70B on Groq is a strong, no-cost fit for
 * resume/cover-letter rewriting (nuanced writing + instruction following)
 * without requiring a paid API key. Override with the AI_MODEL env var
 * without code changes.
 */
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const MAX_OUTPUT_TOKENS = 4096;

/**
 * Converts a Zod output schema into the `response_format.json_schema.schema`
 * shape Groq expects, stripping the `$schema` key Zod adds (Groq doesn't
 * need it). Passed with `strict: false` — this is a hint to the model, not a
 * guarantee, because Groq only documents strict-mode JSON Schema keyword
 * support for a couple of specific models. The app never trusts this alone:
 * every response is re-validated with the same Zod schema below.
 */
function toResponseSchema(name: string, schema: z.ZodType) {
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;
  return {
    type: "json_schema" as const,
    json_schema: {
      name,
      schema: jsonSchema,
      strict: false,
    },
  };
}

/**
 * Translates Groq SDK errors into the app's provider-neutral
 * AIProviderError hierarchy. Never lets a raw SDK error or stack trace reach
 * a Server Action result — see the toSafeMessage() callers in each actions.ts file.
 */
function toAIProviderError(error: unknown): Error {
  if (error instanceof Groq.AuthenticationError || error instanceof Groq.PermissionDeniedError) {
    return new AIAuthenticationError();
  }
  if (error instanceof Groq.RateLimitError) {
    return new AIRateLimitError();
  }
  if (error instanceof Groq.APIConnectionTimeoutError) {
    return new AITimeoutError();
  }
  if (error instanceof Groq.BadRequestError) {
    // Most commonly an oversized request (too many input tokens).
    return new AIContentTooLargeError();
  }
  if (error instanceof Groq.InternalServerError || error instanceof Groq.APIConnectionError) {
    return new AIProviderUnavailableError();
  }
  if (error instanceof Groq.APIError) {
    return new AIUnexpectedError();
  }
  return new AIUnexpectedError();
}

/**
 * Parses and validates a Groq chat completion's JSON content against a Zod
 * schema. Malformed JSON and schema mismatches both become
 * AIOutputValidationError — never inserted into the DB, never surfaced as a
 * fake result. This is the mandatory second layer of safety regardless of
 * how much the model's response_format hint was honored.
 */
function parseAndValidate<T>(content: string | null | undefined, schema: z.ZodType<T>): T {
  if (!content) throw new AIOutputValidationError();
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AIOutputValidationError();
  }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new AIOutputValidationError();
  return result.data;
}

class GroqProvider implements AIProvider {
  readonly name = "groq";
  private readonly client: Groq;
  private readonly model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Groq({ apiKey });
    this.model = model;
  }

  async optimizeResume(input: OptimizeResumeInput): Promise<OptimizeResumeOutput> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        max_completion_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          { role: "system", content: buildOptimizeResumeSystemPrompt() },
          { role: "user", content: buildOptimizeResumeUserPrompt(input) },
        ],
        response_format: toResponseSchema("optimize_resume_output", optimizeResumeOutputSchema),
      });
      return parseAndValidate(completion.choices[0]?.message.content, optimizeResumeOutputSchema);
    } catch (error) {
      if (error instanceof AIOutputValidationError) throw error;
      throw toAIProviderError(error);
    }
  }

  async generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        max_completion_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          { role: "system", content: buildCoverLetterSystemPrompt() },
          { role: "user", content: buildCoverLetterUserPrompt(input) },
        ],
        response_format: toResponseSchema("generate_cover_letter_output", generateCoverLetterOutputSchema),
      });
      return parseAndValidate(completion.choices[0]?.message.content, generateCoverLetterOutputSchema);
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
 * .env.example. Currently only `AI_PROVIDER=groq` is implemented; anything
 * else (or a missing key) returns `null` so callers can show a clear "not
 * configured" state instead of a fake result.
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

  if (providerName === "groq") {
    const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
    cachedProvider = new GroqProvider(apiKey, model);
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

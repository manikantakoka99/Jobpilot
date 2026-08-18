import Groq from "groq-sdk";
import { z } from "zod";

import {
  optimizeResumeOutputSchema,
  generateCoverLetterOutputSchema,
  generateInterviewQuestionsOutputSchema,
  evaluateInterviewAnswerOutputSchema,
  summarizeInterviewSessionOutputSchema,
  careerAssistantChatOutputSchema,
} from "@/lib/validations/ai-output";
import {
  buildOptimizeResumeSystemPrompt,
  buildOptimizeResumeUserPrompt,
  buildCoverLetterSystemPrompt,
  buildCoverLetterUserPrompt,
  buildInterviewQuestionsSystemPrompt,
  buildInterviewQuestionsUserPrompt,
  buildAnswerFeedbackSystemPrompt,
  buildAnswerFeedbackUserPrompt,
  buildInterviewSummarySystemPrompt,
  buildInterviewSummaryUserPrompt,
  buildCareerAssistantSystemPrompt,
  buildCareerAssistantUserPrompt,
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
import { checkPromptBudget } from "./token-budget";
import type {
  AIProvider,
  OptimizeResumeInput,
  GenerateCoverLetterInput,
  OptimizeResumeOutput,
  GenerateCoverLetterOutput,
  GenerateInterviewQuestionsInput,
  GenerateInterviewQuestionsOutput,
  EvaluateInterviewAnswerInput,
  EvaluateInterviewAnswerOutput,
  SummarizeInterviewSessionInput,
  SummarizeInterviewSessionOutput,
  CareerAssistantChatInput,
  CareerAssistantChatOutput,
} from "./types";

/**
 * Free-tier default: openai/gpt-oss-120b on Groq. llama-3.3-70b-versatile
 * (the previous default) was retired by Groq and now 404s on every request
 * for any key (confirmed live via client.models.list() — the model is
 * absent from the account's catalog entirely). gpt-oss-120b is the
 * strongest currently-available free/on_demand chat model on Groq for this
 * account: 131,072 token context window, "json_mode" in its
 * supported_features (confirmed via client.models.retrieve-equivalent
 * lookup against the live models list), and it produces valid JSON that
 * passes every one of this app's six Zod output schemas when tested
 * directly against the real prompts this file builds. Override with the
 * AI_MODEL env var without code changes.
 *
 * Output token budgets are per-feature because the output schemas are very
 * different sizes (see lib/validations/ai-output.ts): a rewritten resume
 * plus a full changes list can legitimately run several times longer than a
 * single cover letter. All are well under this model's 65,536
 * max_completion_tokens ceiling. Note: the account's free on_demand service
 * tier also enforces its own tokens-per-minute (TPM) quota independent of
 * this app's own context-window budgeting below — see the AIRateLimitError
 * branch in toAIProviderError() and the 413 handling added for it.
 */
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const RESUME_OUTPUT_TOKENS = 8192;
const COVER_LETTER_OUTPUT_TOKENS = 4096;
const INTERVIEW_QUESTIONS_OUTPUT_TOKENS = 4096;
const ANSWER_FEEDBACK_OUTPUT_TOKENS = 1536;
const INTERVIEW_SUMMARY_OUTPUT_TOKENS = 1536;
const CAREER_ASSISTANT_OUTPUT_TOKENS = 1536;

/**
 * `json_object` mode ("json_mode") is what we use, not Groq's structured
 * outputs (`response_format: {type: "json_schema"}`) — kept deliberately
 * simple and portable across models rather than tied to a specific model's
 * schema-following feature (the previous default, llama-3.3-70b-versatile,
 * didn't support structured outputs at all; the current default,
 * openai/gpt-oss-120b, does, but we still don't rely on it). The model is
 * constrained to emit valid JSON, and the required shape is spelled out
 * explicitly in the system prompt (see lib/ai/prompts.ts). Either way, the
 * app never trusts the model's adherence to the shape alone — every
 * response is re-validated against the same Zod schema in
 * parseAndValidate() below, which is the real enforcement layer.
 */
const JSON_OBJECT_RESPONSE_FORMAT = { type: "json_object" as const };

/**
 * Translates Groq SDK errors into the app's provider-neutral
 * AIProviderError hierarchy. Never lets a raw SDK error or stack trace reach
 * a Server Action result — see the toSafeMessage() callers in each actions.ts file.
 */
function toAIProviderError(error: unknown, budget?: { estimatedPromptTokens: number; limitTokens: number }): Error {
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
    // Groq's 400s cover several unrelated causes (bad params, malformed
    // messages, oversized input). Only the ones Groq itself attributes to
    // the `messages` field are genuinely a "too large" problem — anything
    // else is an app/request bug, not the user's content, so it shouldn't
    // be misreported as "shorten your resume".
    const body = error.error as { error?: { param?: string; message?: string } } | undefined;
    const isLengthError = body?.error?.param === "messages" || /reduce.*length/i.test(body?.error?.message ?? "");
    if (isLengthError) {
      const detail = budget
        ? `Your resume and job description exceed the AI input limit (~${budget.estimatedPromptTokens.toLocaleString()} estimated tokens, limit ~${budget.limitTokens.toLocaleString()}). Try removing unrelated boilerplate from the job description.`
        : undefined;
      return new AIContentTooLargeError(detail);
    }
    return new AIUnexpectedError();
  }
  if (error instanceof Groq.InternalServerError || error instanceof Groq.APIConnectionError) {
    return new AIProviderUnavailableError();
  }
  if (error instanceof Groq.APIError) {
    // Groq's SDK has no dedicated error subclass for 413 (it only special-
    // cases 400/401/403/404/409/422/429/5xx — see groq-sdk/core/error.js —
    // so a 413 lands here as a bare APIError). Groq returns 413 for its
    // free/on_demand tier's tokens-per-minute (TPM) quota, distinct from
    // the per-request context-window budget this app checks up front in
    // checkPromptBudget(): a request can be well within the model's context
    // window and still get rejected here if the account has made other
    // large requests within the same rolling minute. Treat it the same as
    // AIRateLimitError (a 429) rather than the generic fallback, since it's
    // the same actionable situation for the user: wait and retry.
    if (error.status === 413) {
      console.warn(`[ai] Groq 413 (tokens-per-minute quota) — treated as rate limit`);
      return new AIRateLimitError();
    }
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

/**
 * Groq occasionally returns JSON that doesn't match the requested shape
 * (json_object mode constrains syntax, not our schema — see the comment on
 * JSON_OBJECT_RESPONSE_FORMAT above) even though the *same* prompt reliably
 * succeeds on a second try. Rather than surface that transient failure to
 * the user immediately, retry the completion itself a bounded number of
 * times — never retrying anything already known bad, and never retrying at
 * all for errors other than validation (rate limits, timeouts, etc. are the
 * caller's concern, not this one).
 *
 * Total attempts = 1 initial + MAX_VALIDATION_RETRIES retries. Nothing is
 * persisted anywhere in this path — only a validated result is ever
 * returned, so callers still never save invalid output, and a caller that
 * retries this whole flow again (e.g. the user clicking "Generate" again)
 * can't create duplicate saved rows either, since saving is a separate,
 * explicit step (see saveResumeVersion / saveCoverLetter).
 */
const MAX_VALIDATION_RETRIES = 2;

/**
 * Takes a completion-request thunk rather than a params object so the call
 * site's object literal (built fresh per attempt) keeps driving the SDK's
 * non-streaming overload resolution — same request every attempt, just
 * re-issued.
 */
async function createValidatedCompletion<T>(
  requestCompletion: () => Promise<Groq.Chat.Completions.ChatCompletion>,
  schema: z.ZodType<T>,
  budget: { estimatedPromptTokens: number; limitTokens: number },
  logLabel: string,
): Promise<T> {
  const maxAttempts = MAX_VALIDATION_RETRIES + 1;
  let lastValidationError: AIOutputValidationError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const completion = await requestCompletion();
      return parseAndValidate(completion.choices[0]?.message.content, schema);
    } catch (error) {
      if (error instanceof AIOutputValidationError) {
        lastValidationError = error;
        // Deliberately no request/response content here — attempt number
        // and feature label only, per the "never log full resumes/job
        // descriptions" rule.
        console.warn(`[ai:${logLabel}] output failed schema validation on attempt ${attempt}/${maxAttempts}`);
        continue;
      }
      throw toAIProviderError(error, budget);
    }
  }

  throw lastValidationError ?? new AIOutputValidationError();
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
    const systemPrompt = buildOptimizeResumeSystemPrompt();
    const userPrompt = buildOptimizeResumeUserPrompt(input);

    // Pre-flight check against the model's real, verified context window
    // (see lib/ai/token-budget.ts) rather than relying on Groq's error
    // response as the only backstop — this lets us reject genuinely huge
    // requests with a useful message before spending an API call, while
    // accepting realistic resume + job description lengths.
    const budget = checkPromptBudget(systemPrompt, userPrompt, RESUME_OUTPUT_TOKENS);
    if (!budget.ok) {
      throw new AIContentTooLargeError(
        `Your resume and job description exceed the AI input limit (~${budget.estimatedPromptTokens.toLocaleString()} estimated tokens, limit ~${budget.limitTokens.toLocaleString()}). Try removing unrelated boilerplate from the job description.`,
      );
    }

    return createValidatedCompletion(
      () =>
        this.client.chat.completions.create({
          model: this.model,
          max_completion_tokens: RESUME_OUTPUT_TOKENS,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: JSON_OBJECT_RESPONSE_FORMAT,
        }),
      optimizeResumeOutputSchema,
      budget,
      "optimizeResume",
    );
  }

  async generateCoverLetter(input: GenerateCoverLetterInput): Promise<GenerateCoverLetterOutput> {
    const systemPrompt = buildCoverLetterSystemPrompt();
    const userPrompt = buildCoverLetterUserPrompt(input);

    const budget = checkPromptBudget(systemPrompt, userPrompt, COVER_LETTER_OUTPUT_TOKENS);
    if (!budget.ok) {
      throw new AIContentTooLargeError(
        `Your resume and job description exceed the AI input limit (~${budget.estimatedPromptTokens.toLocaleString()} estimated tokens, limit ~${budget.limitTokens.toLocaleString()}). Try removing unrelated boilerplate from the job description.`,
      );
    }

    return createValidatedCompletion(
      () =>
        this.client.chat.completions.create({
          model: this.model,
          max_completion_tokens: COVER_LETTER_OUTPUT_TOKENS,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: JSON_OBJECT_RESPONSE_FORMAT,
        }),
      generateCoverLetterOutputSchema,
      budget,
      "generateCoverLetter",
    );
  }

  async generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput> {
    const systemPrompt = buildInterviewQuestionsSystemPrompt();
    const userPrompt = buildInterviewQuestionsUserPrompt(input);

    const budget = checkPromptBudget(systemPrompt, userPrompt, INTERVIEW_QUESTIONS_OUTPUT_TOKENS);
    if (!budget.ok) {
      throw new AIContentTooLargeError(
        `Your resume and job description exceed the AI input limit (~${budget.estimatedPromptTokens.toLocaleString()} estimated tokens, limit ~${budget.limitTokens.toLocaleString()}). Try removing unrelated boilerplate from the job description.`,
      );
    }

    return createValidatedCompletion(
      () =>
        this.client.chat.completions.create({
          model: this.model,
          max_completion_tokens: INTERVIEW_QUESTIONS_OUTPUT_TOKENS,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: JSON_OBJECT_RESPONSE_FORMAT,
        }),
      generateInterviewQuestionsOutputSchema,
      budget,
      "generateInterviewQuestions",
    );
  }

  async evaluateInterviewAnswer(input: EvaluateInterviewAnswerInput): Promise<EvaluateInterviewAnswerOutput> {
    const systemPrompt = buildAnswerFeedbackSystemPrompt();
    const userPrompt = buildAnswerFeedbackUserPrompt(input);

    const budget = checkPromptBudget(systemPrompt, userPrompt, ANSWER_FEEDBACK_OUTPUT_TOKENS);
    if (!budget.ok) {
      throw new AIContentTooLargeError(
        `Your resume exceeds the AI input limit (~${budget.estimatedPromptTokens.toLocaleString()} estimated tokens, limit ~${budget.limitTokens.toLocaleString()}).`,
      );
    }

    return createValidatedCompletion(
      () =>
        this.client.chat.completions.create({
          model: this.model,
          max_completion_tokens: ANSWER_FEEDBACK_OUTPUT_TOKENS,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: JSON_OBJECT_RESPONSE_FORMAT,
        }),
      evaluateInterviewAnswerOutputSchema,
      budget,
      "evaluateInterviewAnswer",
    );
  }

  async summarizeInterviewSession(input: SummarizeInterviewSessionInput): Promise<SummarizeInterviewSessionOutput> {
    const systemPrompt = buildInterviewSummarySystemPrompt();
    const userPrompt = buildInterviewSummaryUserPrompt(input);

    const budget = checkPromptBudget(systemPrompt, userPrompt, INTERVIEW_SUMMARY_OUTPUT_TOKENS);
    if (!budget.ok) {
      throw new AIContentTooLargeError(
        `This interview session's transcript exceeds the AI input limit (~${budget.estimatedPromptTokens.toLocaleString()} estimated tokens, limit ~${budget.limitTokens.toLocaleString()}).`,
      );
    }

    return createValidatedCompletion(
      () =>
        this.client.chat.completions.create({
          model: this.model,
          max_completion_tokens: INTERVIEW_SUMMARY_OUTPUT_TOKENS,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: JSON_OBJECT_RESPONSE_FORMAT,
        }),
      summarizeInterviewSessionOutputSchema,
      budget,
      "summarizeInterviewSession",
    );
  }

  async careerAssistantChat(input: CareerAssistantChatInput): Promise<CareerAssistantChatOutput> {
    const systemPrompt = buildCareerAssistantSystemPrompt();
    const userPrompt = buildCareerAssistantUserPrompt(input);

    const budget = checkPromptBudget(systemPrompt, userPrompt, CAREER_ASSISTANT_OUTPUT_TOKENS);
    if (!budget.ok) {
      throw new AIContentTooLargeError(
        `This conversation exceeds the AI input limit (~${budget.estimatedPromptTokens.toLocaleString()} estimated tokens, limit ~${budget.limitTokens.toLocaleString()}). Try starting a new conversation.`,
      );
    }

    return createValidatedCompletion(
      () =>
        this.client.chat.completions.create({
          model: this.model,
          max_completion_tokens: CAREER_ASSISTANT_OUTPUT_TOKENS,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: JSON_OBJECT_RESPONSE_FORMAT,
        }),
      careerAssistantChatOutputSchema,
      budget,
      "careerAssistantChat",
    );
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

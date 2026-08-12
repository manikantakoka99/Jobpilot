/**
 * Typed error hierarchy for the AI provider abstraction (lib/ai/). Provider
 * implementations translate their own SDK-specific failures into one of
 * these — callers (services/*, Server Actions) only ever see these types,
 * never a raw provider SDK error, HTTP status, or stack trace.
 */
export class AIProviderError extends Error {
  /** Safe to render directly in the UI. */
  readonly userMessage: string;

  constructor(userMessage: string, options?: { cause?: unknown }) {
    super(userMessage, options);
    this.userMessage = userMessage;
    this.name = this.constructor.name;
  }
}

export class AIProviderNotConfiguredError extends AIProviderError {
  constructor() {
    super(
      "AI features aren't configured yet. Set AI_PROVIDER and AI_API_KEY in your environment to enable the Resume Optimizer and Cover Letter Generator.",
    );
  }
}

export class AIAuthenticationError extends AIProviderError {
  constructor() {
    super("The configured AI provider rejected the API key. Check AI_API_KEY and try again.");
  }
}

export class AIRateLimitError extends AIProviderError {
  constructor() {
    super("The AI provider is rate-limiting requests right now. Please wait a moment and try again.");
  }
}

export class AITimeoutError extends AIProviderError {
  constructor() {
    super("The AI provider took too long to respond. Please try again.");
  }
}

export class AIProviderUnavailableError extends AIProviderError {
  constructor() {
    super("The AI provider is temporarily unavailable. Please try again in a few minutes.");
  }
}

export class AIContentTooLargeError extends AIProviderError {
  constructor() {
    super("Your resume or job description is too long for the AI provider to process. Please shorten it and try again.");
  }
}

export class AIOutputValidationError extends AIProviderError {
  constructor() {
    super("The AI provider returned a response we couldn't validate. Nothing was saved — please try again.");
  }
}

export class AIUnexpectedError extends AIProviderError {
  constructor() {
    super("Something went wrong talking to the AI provider. Please try again.");
  }
}

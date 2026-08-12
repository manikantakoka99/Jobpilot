/**
 * Text normalization helpers shared across the ATS engine.
 *
 * We deliberately keep two forms of every document in memory:
 * - the *original* extracted text (used for section/heading detection and
 *   for display/debugging, where line breaks and casing carry meaning), and
 * - a *normalized* form (lowercased, whitespace-collapsed) used for
 *   keyword/skill matching, where casing and stray whitespace shouldn't
 *   affect whether a term is considered present.
 */

/** Collapses line endings/whitespace without discarding structure (line breaks kept). */
export function normalizeWhitespace(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Lowercases and collapses all whitespace to single spaces (line breaks
 * included), while preserving characters that are meaningful inside skill
 * names such as `.`, `/`, `+`, `#`, `-` (e.g. "Node.js", "CI/CD", "C++", "C#").
 */
export function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .replace(/ /g, " ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenizes normalized text into words, keeping tech-relevant internal
 * punctuation (e.g. "node.js", "c++", "ci/cd") but stripping leading/
 * trailing punctuation from each token.
 */
export function tokenize(normalizedText: string): string[] {
  const matches = normalizedText.match(/[a-z0-9][a-z0-9+#./-]*/g) ?? [];
  return matches
    .map((token) => token.replace(/^[./-]+|[./-]+$/g, ""))
    .filter((token) => token.length > 0);
}

/**
 * Builds a word-boundary-aware regex for a single phrase/variant so that
 * matching "java" doesn't also match inside "javascript", while still
 * allowing phrases with internal spaces or punctuation (e.g. "ci/cd").
 */
export function boundaryRegex(variant: string): RegExp {
  const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
}

export function containsPhrase(normalizedHaystack: string, variant: string): boolean {
  return boundaryRegex(variant).test(normalizedHaystack);
}

const STOPWORDS = new Set(
  (
    "a about above after again against all am an and any are aren't as at be because been before " +
    "being below between both but by can't cannot could couldn't did didn't do does doesn't doing " +
    "don't down during each few for from further had hadn't has hasn't have haven't having he he'd " +
    "he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into " +
    "is isn't it it's its itself let's me more most mustn't my myself no nor not of off on once only " +
    "or other ought our ours ourselves out over own same shan't she she'd she'll she's should " +
    "shouldn't so some such than that that's the their theirs them themselves then there there's " +
    "these they they'd they'll they're they've this those through to too under until up very was " +
    "wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while " +
    "who who's whom why why's with won't would wouldn't you you'd you'll you're you've your yours " +
    "yourself yourselves will shall must within across per etc using use used via role responsible " +
    "responsibilities requirement requirements required preferred ability skills experience years " +
    "year work team strong excellent job company looking candidate candidates including include " +
    "e g eg ie"
  ).split(" "),
);

export function isStopword(word: string): boolean {
  return STOPWORDS.has(word) || word.length < 3 || /^\d+$/.test(word);
}

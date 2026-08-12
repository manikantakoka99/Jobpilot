import type { KeywordMatchResult } from "./types";
import { containsPhrase, isStopword, normalizeForMatch, tokenize } from "./normalize";
import { findSkillsIn, skillPresentIn, SKILLS } from "./skills";

const MAX_GENERIC_KEYWORDS = 25;

/**
 * Frequency-based extraction of additional (non-dictionary) keywords from
 * a job description: unigrams and bigrams that recur often enough to be
 * plausibly important, after stopwords are filtered out. This is a
 * classic deterministic technique (similar in spirit to RAKE) — not a
 * machine-learning or AI model.
 */
function extractGenericKeywords(jdNormalized: string): string[] {
  const tokens = tokenize(jdNormalized).filter((t) => !isStopword(t));

  const unigramCounts = new Map<string, number>();
  for (const token of tokens) {
    unigramCounts.set(token, (unigramCounts.get(token) ?? 0) + 1);
  }

  const bigramCounts = new Map<string, number>();
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (!a || !b) continue;
    const bigram = `${a} ${b}`;
    bigramCounts.set(bigram, (bigramCounts.get(bigram) ?? 0) + 1);
  }

  const candidates: { term: string; score: number }[] = [];
  for (const [term, count] of unigramCounts) {
    if (count >= 2) candidates.push({ term, score: count });
  }
  for (const [term, count] of bigramCounts) {
    // Bigrams are rarer by nature; weight them slightly higher so genuinely
    // recurring phrases (e.g. "customer service") surface ahead of common
    // single words that just happen to repeat.
    if (count >= 2) candidates.push({ term, score: count + 0.5 });
  }

  candidates.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const result: string[] = [];
  for (const { term } of candidates) {
    // Skip a unigram that's already covered by a higher-ranked bigram containing it.
    if ([...seen].some((s) => s.includes(term) && s !== term)) continue;
    if (seen.has(term)) continue;
    seen.add(term);
    result.push(term);
    if (result.length >= MAX_GENERIC_KEYWORDS) break;
  }

  return result;
}

/**
 * Compares a job description against resume text and returns which
 * keywords (curated skills + frequent JD terms) are present in the resume.
 *
 * Matching is phrase/word-boundary aware (via lib/ats/normalize.ts) rather
 * than naive substring matching, and handles common variant spellings via
 * the skills dictionary (e.g. "JavaScript" / "js", "Node.js" / "nodejs").
 */
export function matchKeywords(resumeText: string, jobDescription: string): KeywordMatchResult {
  const resumeNormalized = normalizeForMatch(resumeText);
  const jdNormalized = normalizeForMatch(jobDescription);

  const jdSkills = SKILLS.filter((skill) => skillPresentIn(jdNormalized, skill));
  const genericTerms = extractGenericKeywords(jdNormalized).filter(
    // Don't duplicate a generic term that's already represented by a skill variant.
    (term) => !jdSkills.some((skill) => skill.variants.includes(term)),
  );

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const importantMatched: string[] = [];
  const importantMissing: string[] = [];

  for (const skill of jdSkills) {
    const found = skillPresentIn(resumeNormalized, skill);
    (found ? matchedKeywords : missingKeywords).push(skill.name);
    (found ? importantMatched : importantMissing).push(skill.name);
  }

  for (const term of genericTerms) {
    const found = containsPhrase(resumeNormalized, term);
    (found ? matchedKeywords : missingKeywords).push(term);
  }

  const total = matchedKeywords.length + missingKeywords.length;
  const matchPercentage = total === 0 ? 0 : Math.round((matchedKeywords.length / total) * 100);

  return {
    matchedKeywords,
    missingKeywords,
    importantMatched,
    importantMissing,
    matchPercentage: Math.min(100, Math.max(0, matchPercentage)),
  };
}

/** Exposed for the Skills Match section, which scopes to the curated dictionary only. */
export function extractSkillsFromText(text: string) {
  return findSkillsIn(text);
}

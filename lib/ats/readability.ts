import type { ReadabilityResult } from "./types";
import { normalizeWhitespace, tokenize, normalizeForMatch, isStopword } from "./normalize";

const EMAIL_REGEX = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;
const PHONE_REGEX = /(\+?\d[\d\s().-]{7,}\d)/;

/**
 * Basic, measurable readability signals — word count, sentence length,
 * contact info presence, and excessive word repetition. Deliberately
 * avoids unsupported subjective claims (e.g. "well written").
 */
export function analyzeReadability(resumeText: string): ReadabilityResult {
  const text = normalizeWhitespace(resumeText);
  const normalized = normalizeForMatch(text);

  const words = tokenize(normalized);
  const wordCount = words.length;

  const sentenceChunks = text.split(/[.!?]+(?:\s|\n|$)/).map((s) => s.trim()).filter(Boolean);
  const sentenceCount = sentenceChunks.length;
  const averageSentenceLength = sentenceCount === 0 ? 0 : Math.round(wordCount / sentenceCount);

  const hasContactInfo = EMAIL_REGEX.test(text) || PHONE_REGEX.test(text);

  const notes: string[] = [];
  let score = 100;

  if (!hasContactInfo) {
    notes.push("No email address or phone number was detected — make sure your contact details are included as text (not only inside an image or icon).");
    score -= 30;
  }

  if (wordCount > 0 && wordCount < 150) {
    notes.push(`Only ${wordCount} words were extracted — your resume may be too short, or content may not be extracting as text.`);
    score -= 20;
  } else if (wordCount > 1200) {
    notes.push(`${wordCount} words were extracted — consider trimming your resume to keep it focused (most resumes fit comfortably in 1-2 pages).`);
    score -= 10;
  }

  if (averageSentenceLength > 40) {
    notes.push("Average sentence/line length is quite long — consider using concise bullet points instead of long paragraphs.");
    score -= 10;
  }

  const freq = new Map<string, number>();
  for (const word of words) {
    if (isStopword(word)) continue;
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }
  const repeated = [...freq.entries()].filter(([, count]) => count >= 8 && wordCount < 1500);
  for (const [word, count] of repeated.slice(0, 3)) {
    notes.push(`The word "${word}" appears ${count} times — consider varying your language to avoid repetition.`);
    score -= 5;
  }

  return {
    wordCount,
    sentenceCount,
    averageSentenceLength,
    hasContactInfo,
    notes,
    score: Math.min(100, Math.max(0, Math.round(score))),
  };
}

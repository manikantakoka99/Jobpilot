import type { FormattingResult } from "./types";
import { normalizeWhitespace } from "./normalize";

/**
 * Text-level formatting checks only. We work from extracted plain text, not
 * a rendered/visual view of the document, so every finding here is phrased
 * as an inference from the text ("may indicate...") rather than a claim
 * about the document's actual visual layout.
 */
export function analyzeFormatting(resumeText: string): FormattingResult {
  const issues: string[] = [];
  let score = 100;

  const text = normalizeWhitespace(resumeText);
  const lines = text.split("\n").filter((l) => l.trim().length > 0);

  // High ratio of symbols can indicate tables/graphics/icon-heavy templates
  // that don't extract cleanly to text.
  const symbolCount = (text.match(/[^\w\s.,;:'"()/&%+#-]/g) ?? []).length;
  const symbolRatio = text.length === 0 ? 0 : symbolCount / text.length;
  if (symbolRatio > 0.03) {
    issues.push(
      "A high ratio of unusual symbols was detected in the extracted text — this can indicate icons, tables, or a graphics-heavy template that don't extract cleanly for ATS parsing.",
    );
    score -= 15;
  }

  // Many very short lines can indicate a multi-column layout collapsing
  // oddly when text is extracted linearly.
  const shortLines = lines.filter((l) => l.trim().split(/\s+/).length <= 2);
  const shortLineRatio = lines.length === 0 ? 0 : shortLines.length / lines.length;
  if (lines.length > 15 && shortLineRatio > 0.45) {
    issues.push(
      "A large proportion of very short lines was detected in the extracted text — this can indicate a multi-column or graphics-heavy layout, which some ATS systems parse incorrectly. A single-column layout is generally safest.",
    );
    score -= 15;
  }

  // Inconsistent heading capitalization style (some ALL CAPS, some Title Case).
  const headingLikeLines = lines.filter((l) => l.trim().length <= 40 && l.trim().split(/\s+/).length <= 5);
  const allCapsHeadings = headingLikeLines.filter((l) => l === l.toUpperCase() && /[a-z]/i.test(l));
  const mixedCaseHeadings = headingLikeLines.filter((l) => l !== l.toUpperCase() && /^[A-Z]/.test(l.trim()));
  if (allCapsHeadings.length >= 2 && mixedCaseHeadings.length >= 2) {
    issues.push(
      "Section headings appear to use inconsistent capitalization (a mix of ALL CAPS and Title Case) — consider using one consistent style throughout.",
    );
    score -= 10;
  }

  return { issues, score: Math.min(100, Math.max(0, Math.round(score))) };
}

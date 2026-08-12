import type { StructureResult } from "./types";
import { normalizeWhitespace } from "./normalize";

interface SectionDefinition {
  name: string;
  /** Lowercase heading variants that count as a reasonable match for this section. */
  headings: string[];
  /** Core sections are weighted more heavily and always listed when missing. */
  core: boolean;
}

const SECTIONS: SectionDefinition[] = [
  { name: "Contact", headings: ["contact", "contact information", "contact info"], core: false },
  { name: "Summary", headings: ["summary", "professional summary", "profile", "objective", "career objective", "about me"], core: false },
  { name: "Skills", headings: ["skills", "technical skills", "core competencies", "key skills", "competencies"], core: true },
  { name: "Experience", headings: ["experience", "work experience", "professional experience", "work history", "employment history", "career history"], core: true },
  { name: "Education", headings: ["education", "academic background", "education & training", "academic qualifications"], core: true },
  { name: "Projects", headings: ["projects", "personal projects", "key projects", "selected projects"], core: false },
  { name: "Certifications", headings: ["certifications", "certificates", "licenses & certifications", "professional certifications"], core: false },
  { name: "Achievements", headings: ["achievements", "awards", "honors & awards", "accomplishments"], core: false },
];

/**
 * Treats a line as a "heading" candidate if it's short (a real section
 * title, not a sentence) and — once punctuation/casing is stripped —
 * matches one of a section's known variants exactly.
 */
function isHeadingLine(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 40) return null;
  if (trimmed.split(/\s+/).length > 5) return null;

  const cleaned = trimmed
    .toLowerCase()
    .replace(/[:•\-–—]+$/, "")
    .replace(/^[:•\-–—]+/, "")
    .trim();

  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Detects resume sections by scanning for short "heading-like" lines that
 * match known variants (e.g. "Professional Experience", "Work History" both
 * count as the Experience section) — so common, reasonable naming
 * differences aren't falsely reported as missing.
 */
export function analyzeStructure(resumeText: string): StructureResult {
  const lines = normalizeWhitespace(resumeText).split("\n");
  const headingCandidates = lines.map(isHeadingLine).filter((h): h is string => h !== null);

  const detectedSections: string[] = [];
  for (const section of SECTIONS) {
    const found = headingCandidates.some((heading) => section.headings.includes(heading));
    if (found) detectedSections.push(section.name);
  }

  const missingSections = SECTIONS.filter((s) => !detectedSections.includes(s.name)).map((s) => s.name);

  const issues: string[] = [];
  for (const section of SECTIONS) {
    if (missingSections.includes(section.name)) {
      issues.push(`${section.name} section not detected.`);
    }
  }

  const coreSections = SECTIONS.filter((s) => s.core);
  const secondarySections = SECTIONS.filter((s) => !s.core);
  const coreFound = coreSections.filter((s) => detectedSections.includes(s.name)).length;
  const secondaryFound = secondarySections.filter((s) => detectedSections.includes(s.name)).length;

  const coreScore = coreSections.length === 0 ? 100 : (coreFound / coreSections.length) * 70;
  const secondaryScore = secondarySections.length === 0 ? 0 : (secondaryFound / secondarySections.length) * 30;
  const score = Math.round(Math.min(100, Math.max(0, coreScore + secondaryScore)));

  return { detectedSections, missingSections, issues, score };
}

import mammoth from "mammoth";

import type { ExtractionResult } from "./types";
import { normalizeWhitespace } from "./normalize";

export async function extractDocxText(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const { value } = await mammoth.extractRawText({ buffer });
    const normalized = normalizeWhitespace(value);

    if (normalized.length === 0) {
      return { status: "no_text_layer" };
    }

    return { status: "success", text: normalized };
  } catch {
    return { status: "failed", reason: "The DOCX file appears to be corrupted or invalid." };
  }
}

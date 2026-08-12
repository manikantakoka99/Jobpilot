import { extractText, getDocumentProxy } from "unpdf";

import type { ExtractionResult } from "./types";
import { normalizeWhitespace } from "./normalize";

/**
 * Below this average character count per page, we treat the PDF as having
 * no real text layer (i.e. a scanned/image-based document). We do not
 * attempt OCR — see the "no_text_layer" status handling in the UI, which
 * asks the user to upload a text-based file instead.
 */
const MIN_CHARS_PER_PAGE_FOR_TEXT_LAYER = 5;

export async function extractPdfText(bytes: Uint8Array): Promise<ExtractionResult> {
  let pdf: Awaited<ReturnType<typeof getDocumentProxy>>;

  try {
    pdf = await getDocumentProxy(bytes);
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "PasswordException") {
      return { status: "password_protected" };
    }
    return { status: "failed", reason: "The PDF file appears to be corrupted or invalid." };
  }

  try {
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    const normalized = normalizeWhitespace(text);

    if (normalized.length < totalPages * MIN_CHARS_PER_PAGE_FOR_TEXT_LAYER) {
      return { status: "no_text_layer" };
    }

    return { status: "success", text: normalized };
  } catch {
    return { status: "failed", reason: "Failed to extract text from this PDF." };
  } finally {
    try {
      await pdf.loadingTask.destroy();
    } catch {
      // Best-effort cleanup only.
    }
  }
}

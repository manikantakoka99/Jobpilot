import type { ExtractionResult } from "./types";
import type { ResumeFileType } from "./file-validation";
import { extractPdfText } from "./extract-pdf";
import { extractDocxText } from "./extract-docx";

/** Dispatches to the appropriate extractor based on validated file type. */
export async function extractResumeText(buffer: Buffer, fileType: ResumeFileType): Promise<ExtractionResult> {
  if (fileType === "pdf") {
    return extractPdfText(new Uint8Array(buffer));
  }
  return extractDocxText(buffer);
}

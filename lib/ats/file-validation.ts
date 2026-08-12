export const MAX_RESUME_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
export const MAX_RESUME_SIZE_LABEL = "8MB";

export const ALLOWED_MIME_TYPES: Record<"pdf" | "docx", string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export type ResumeFileType = "pdf" | "docx";

export type FileValidationResult =
  | { ok: true; fileType: ResumeFileType }
  | { ok: false; error: string };

/**
 * Validates a file's declared name/size/MIME type before any upload happens.
 * Safe to call from both the browser (for instant UX feedback) and the
 * server (as a first line of defense — see `sniffMagicBytes` for the
 * server-side check that can't be spoofed by the client).
 */
export function validateResumeFileMeta(file: { name: string; size: number; type: string }): FileValidationResult {
  if (file.size <= 0) {
    return { ok: false, error: "The selected file is empty." };
  }
  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return { ok: false, error: `File is too large. Maximum supported size is ${MAX_RESUME_SIZE_LABEL}.` };
  }

  const extension = file.name.toLowerCase().split(".").pop();
  const declaredType = file.type;

  if (extension === "pdf" && (declaredType === "" || declaredType === ALLOWED_MIME_TYPES.pdf)) {
    return { ok: true, fileType: "pdf" };
  }
  if (extension === "docx" && (declaredType === "" || declaredType === ALLOWED_MIME_TYPES.docx)) {
    return { ok: true, fileType: "docx" };
  }

  return { ok: false, error: "Unsupported file type. Please upload a PDF or DOCX file." };
}

/**
 * Server-side content sniffing: confirms the file's actual bytes match its
 * claimed type, regardless of what extension/MIME type the client sent.
 * PDFs start with the literal bytes "%PDF-"; DOCX files are ZIP archives
 * (OOXML), which always start with the local-file-header signature
 * `PK\x03\x04`.
 */
export function sniffMagicBytes(bytes: Uint8Array, expectedType: ResumeFileType): boolean {
  if (expectedType === "pdf") {
    return (
      bytes.length >= 5 &&
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46 && // F
      bytes[4] === 0x2d // -
    );
  }

  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 && // P
    bytes[1] === 0x4b && // K
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  );
}

/**
 * Reliable browser-side plain-text download — no document-generation
 * service, no PDF/DOCX fidelity claims. Used to download optimized resumes
 * and cover letters as .txt files.
 */
export function downloadTextFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

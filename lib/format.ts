/** Derives up to 2 uppercase initials from a name or email address. */
export function getInitials(nameOrEmail: string): string {
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return "?";

  const namePart = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  const words = namePart.split(/[\s._-]+/).filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[1][0]).toUpperCase();
}

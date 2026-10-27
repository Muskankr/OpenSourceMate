export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback to execCommand below
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch {
    return false;
  }
}

export function generateStarterComment(
  issueTitle: string,
  repository: string,
  language?: string,
  skills?: string[]
): string {
  const tech =
    language || (skills && skills.length > 0 ? skills[0] : "the required technologies");
  return `Hi! I would love to work on this issue ("${issueTitle}"). I have experience with ${tech} and would appreciate the opportunity to contribute. Could you please assign this to me?`;
}

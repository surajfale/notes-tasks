/**
 * Escaping helpers for the hand-rolled markdown renderers
 * (MarkdownRenderer.svelte / MarkdownEditor.svelte), whose output goes
 * straight into {@html}. Everything user-typed must pass through
 * escapeHtml, and every link target through safeHref.
 */

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/** Escape text for use in HTML content AND quoted attribute values. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:']);

/**
 * Link target for an already-escaped markdown URL, or '#' if unsafe.
 * Absolute URLs must be http(s)/mailto; scheme-less (relative) ones pass.
 * Browsers drop tabs/newlines and leading control characters when parsing
 * URLs ("java\tscript:" runs as javascript:), so those are removed before
 * the scheme is checked, and the cleaned value is what gets returned.
 */
export function safeHref(url: string): string {
  // eslint-disable-next-line no-control-regex
  const cleaned = url.replace(/[\u0000- \u007f]/g, '');
  const scheme = cleaned.match(/^([a-z][a-z0-9+.-]*):/i);
  if (scheme && !ALLOWED_SCHEMES.has(`${scheme[1].toLowerCase()}:`)) return '#';
  return cleaned;
}

/** `[text](url)` → anchor, with a sanitised href. Input must already be escaped. */
export function renderLinks(escapedHtml: string, className: string): string {
  return escapedHtml.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, text: string, url: string) =>
      `<a href="${safeHref(url)}" class="${className}" target="_blank" rel="noopener noreferrer">${text}</a>`
  );
}

/**
 * Web Share Target parsing.
 *
 * manifest.json registers the installed app as an Android share target that
 * opens `/links/new?title=…&text=…&url=…`. Senders are inconsistent about which
 * field carries what:
 *   - Chrome:   url = the page,  title = page title, text = empty (or a selection)
 *   - YouTube, Twitter/X, most apps: url = empty, text = "Some title https://…"
 *   - Some:     title = empty, text = the bare URL
 * So the URL is taken from `url` first, then the first http(s) URL found in
 * `text`; the title from `title`, then whatever text is left once the URL is
 * removed, then the URL's hostname as a last resort (title is required).
 */

export interface SharedLink {
  title: string;
  url: string;
}

const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/i;
// Punctuation that commonly trails a URL in prose ("see https://x.com/a.").
const TRAILING_PUNCTUATION = /[).,;:!?\]]+$/;

function toHttpUrl(candidate: string | null | undefined): string | null {
  const trimmed = candidate?.trim().replace(TRAILING_PUNCTUATION, '');
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    // Only web links — a share target must never prefill javascript:/data: URLs.
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

/**
 * Extracts a link from share-target query params. Returns null when nothing
 * shareable was passed (a normal visit to /links/new), so the form starts empty.
 */
export function parseSharedLink(params: URLSearchParams): SharedLink | null {
  const rawTitle = params.get('title')?.trim() ?? '';
  const rawText = params.get('text')?.trim() ?? '';

  const textUrlMatch = rawText.match(URL_IN_TEXT)?.[0];
  const url = toHttpUrl(params.get('url')) ?? toHttpUrl(textUrlMatch);
  if (!url) return null;

  // Text minus the URL is usually the title when the sender put both in `text`.
  const textWithoutUrl = (textUrlMatch ? rawText.replace(textUrlMatch, '') : rawText)
    .replace(/\s+/g, ' ')
    .replace(/[\s\-–—|:]+$/, '')
    .trim();

  const title = rawTitle || textWithoutUrl || new URL(url).hostname.replace(/^www\./, '');

  return { title, url };
}

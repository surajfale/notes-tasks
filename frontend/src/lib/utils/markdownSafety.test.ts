import { describe, it, expect } from 'vitest';
import { escapeHtml, safeHref, renderLinks } from './markdownSafety';

describe('escapeHtml', () => {
  it('escapes tag and attribute metacharacters', () => {
    expect(escapeHtml(`<img src=x onerror="a('b')">&`)).toBe(
      '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&amp;'
    );
  });
});

describe('safeHref', () => {
  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    '\u0001javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)'
  ])('neutralises %j', (url) => {
    expect(safeHref(url)).toBe('#');
  });

  it.each(['https://example.com/a?b=1&amp;c=2', 'http://x.y', 'mailto:me@example.com', '/tasks/1', '#top', 'notes'])(
    'keeps %s',
    (url) => {
      expect(safeHref(url)).toBe(url);
    }
  );
});

describe('renderLinks', () => {
  it('cannot break out of the href attribute', () => {
    // Escaped first, as the renderers do: the quote can no longer close href.
    const html = renderLinks(escapeHtml('[x](https://a.com" onmouseover="alert(1))'), 'c');
    expect(html).not.toContain('" onmouseover="');
    expect(html).toContain('href="https://a.com&quot;');
  });

  it('turns javascript: links into inert anchors', () => {
    expect(renderLinks('[click](javascript:alert(1))', 'c')).toContain('href="#"');
  });
});

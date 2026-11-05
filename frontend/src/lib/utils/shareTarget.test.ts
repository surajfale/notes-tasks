import { describe, it, expect } from 'vitest';
import { parseSharedLink } from './shareTarget';

const params = (q: Record<string, string>) => new URLSearchParams(q);

describe('parseSharedLink', () => {
  it('returns null for a plain visit with no share params', () => {
    expect(parseSharedLink(params({}))).toBeNull();
  });

  it('uses url + title when the sender fills both (Chrome)', () => {
    expect(
      parseSharedLink(params({ url: 'https://svelte.dev/docs', title: 'Svelte docs', text: '' }))
    ).toEqual({ url: 'https://svelte.dev/docs', title: 'Svelte docs' });
  });

  it('pulls the URL out of text and uses the rest as the title (YouTube, X, …)', () => {
    expect(
      parseSharedLink(params({ text: 'Great talk on Kafka https://youtu.be/abc123' }))
    ).toEqual({ url: 'https://youtu.be/abc123', title: 'Great talk on Kafka' });
  });

  it('prefers an explicit title over leftover text', () => {
    expect(
      parseSharedLink(params({ title: 'Video', text: 'check this https://youtu.be/x' }))
    ).toEqual({ url: 'https://youtu.be/x', title: 'Video' });
  });

  it('falls back to the hostname when only a bare URL is shared', () => {
    expect(parseSharedLink(params({ text: 'https://www.example.com/a/b' }))).toEqual({
      url: 'https://www.example.com/a/b',
      title: 'example.com'
    });
  });

  it('strips punctuation trailing a URL in prose', () => {
    expect(parseSharedLink(params({ text: 'Read this: https://example.com/post).' }))?.url).toBe(
      'https://example.com/post'
    );
  });

  it('falls back to a URL in text when the url param is not a valid http URL', () => {
    expect(
      parseSharedLink(params({ url: 'not a url', text: 'https://example.com' }))?.url
    ).toBe('https://example.com/');
  });

  it('rejects non-web schemes', () => {
    expect(parseSharedLink(params({ url: 'javascript:alert(1)' }))).toBeNull();
    expect(parseSharedLink(params({ text: 'just some words, no link' }))).toBeNull();
  });
});

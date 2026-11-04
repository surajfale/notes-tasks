import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import MarkdownRenderer from './MarkdownRenderer.svelte';

describe('MarkdownRenderer — no HTML injection', () => {
  it('escapes raw HTML inside table cells (tables are parsed before the global escape)', () => {
    const { container } = render(MarkdownRenderer, {
      props: { content: '| a | b |\n|---|---|\n| <img src=x onerror=alert(1)> | ok |' }
    });
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('td')?.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('escapes raw HTML in a pipe line that is not a valid table', () => {
    const { container } = render(MarkdownRenderer, { props: { content: '| <b onclick=x>hi</b> |' } });
    expect(container.querySelector('b')).toBeNull();
  });

  it('neutralises javascript: links and attribute breakouts', () => {
    const { container } = render(MarkdownRenderer, {
      props: { content: '[a](javascript:alert(1)) [b](https://ok.com" onmouseover="alert(1))' }
    });
    const links = container.querySelectorAll('a');
    expect(links[0].getAttribute('href')).toBe('#');
    expect(links[1].hasAttribute('onmouseover')).toBe(false);
  });

  it('still renders normal markdown', () => {
    const { container } = render(MarkdownRenderer, {
      props: { content: '**bold** [site](https://example.com)\n\n| h |\n|---|\n| c |' }
    });
    expect(container.querySelector('strong')?.textContent).toBe('bold');
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://example.com');
    expect(container.querySelector('td')?.textContent).toBe('c');
  });
});

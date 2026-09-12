/**
 * A LOCAL, SIMULATED "AI tidy-up" for the tactile demo components.
 *
 * This is deliberately not a call to the real backend: /api/ai/enhance
 * (see repositories/ai.repository.ts) requires an authenticated JWT and a
 * configured Ollama key, and the tactile demo is a public, unauthenticated
 * route by design (see hooks.client.ts). Wiring the real endpoint here
 * would just 401 for every visitor. Every call site that uses this must
 * visibly label the button/action as a demo simulation — never present
 * this as real inference.
 *
 * The "enhancement" itself is a deterministic heuristic: sentence-case,
 * collapse whitespace, and turn loose multi-line text into a tidy bullet
 * list. The artificial delay exists so the shimmer loading state (see
 * neumorphic.css's .tactile-ai-shimmer) reads as genuine "thinking" time
 * rather than an instant, suspicious flash.
 */

function toSentenceCase(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

const EMPTY_FALLBACKS: Record<'note' | 'task' | 'list', string> = {
  note: 'A short note capturing the key idea, with room to expand later.',
  task: '- Define the first concrete step\n- Note any blockers\n- Set a rough deadline',
  list: 'A quick description of what belongs in this list.'
};

export async function mockEnhanceText(input: string, kind: 'note' | 'task' | 'list' = 'note'): Promise<string> {
  // Simulated latency, not a real network round-trip.
  await new Promise((resolve) => setTimeout(resolve, 650 + Math.random() * 400));

  const trimmed = input.trim();
  if (!trimmed) return EMPTY_FALLBACKS[kind];

  const lines = trimmed
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines.map((line) => `- ${toSentenceCase(line.replace(/^[-*]\s*/, ''))}`).join('\n');
  }

  return toSentenceCase(trimmed.replace(/\s+/g, ' '));
}

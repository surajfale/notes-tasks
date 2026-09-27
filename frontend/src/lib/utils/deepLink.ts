/**
 * Helpers for the task links in notification emails
 * (backend: emailTemplateService.generateTaskDeepLink -> /tasks/link/<token>).
 */

const OBJECT_ID = /^[0-9a-f]{24}$/i;

export interface TaskLinkTarget {
  userId: string;
  taskId: string;
}

/**
 * Read which task (and which account) an email link points at.
 *
 * The token is a JWT signed by the backend. It is deliberately NOT verified
 * here — the browser can't, and doesn't need to: the result is only used to
 * decide where to navigate. The task page then loads the task with the
 * user's own session, so the API's normal ownership checks still apply and
 * a forged or tampered token can't reveal anything. Decoding locally also
 * means an old email (the token expires after 24h) still opens the task for
 * a logged-in user instead of failing.
 *
 * @returns The target, or null if the token isn't a well-formed task link.
 */
export function readTaskLink(token: string): TaskLinkTarget | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));

    if (payload?.type !== 'deep_link') return null;
    if (!OBJECT_ID.test(String(payload.taskId)) || !OBJECT_ID.test(String(payload.userId))) return null;

    return { userId: String(payload.userId), taskId: String(payload.taskId) };
  } catch {
    return null;
  }
}

/**
 * Validate a post-login `?redirect=` target. Only same-site absolute paths
 * are allowed, so the login page can't be used as an open redirect
 * (`//evil.com`, `/\evil.com`, `https://...` and `javascript:` are rejected).
 */
export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null;
  return value;
}

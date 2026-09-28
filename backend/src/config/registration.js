/**
 * Who may create an account.
 *
 *   REGISTRATION_ENABLED=true     -> 'open':   anyone can sign up
 *   REGISTRATION_INVITE_CODE=...  -> 'invite': sign-up requires that code
 *   neither (the default)         -> 'closed': nobody can sign up
 *
 * Closed by default: this is a personal app, so an unset variable must never
 * mean "open to the internet". Read on every call (not cached at startup) so
 * changing the env var on the host takes effect on restart without surprises
 * in tests. Enforced in authController.register; the frontend only reads the
 * mode (GET /api/auth/registration-status) to decide what to show.
 */

const crypto = require('crypto');

function registrationMode() {
  if (process.env.REGISTRATION_ENABLED === 'true') return 'open';
  if (process.env.REGISTRATION_INVITE_CODE) return 'invite';
  return 'closed';
}

/**
 * Constant-time comparison, so response timing can't be used to guess the
 * invite code character by character. Hashing first makes both inputs the
 * same length, which timingSafeEqual requires, without leaking the code's
 * length through an early return.
 */
function inviteCodeMatches(candidate) {
  const expected = process.env.REGISTRATION_INVITE_CODE;
  if (!expected || typeof candidate !== 'string' || candidate.length === 0) return false;
  const digest = (value) => crypto.createHash('sha256').update(value).digest();
  return crypto.timingSafeEqual(digest(candidate.trim()), digest(expected));
}

/**
 * @param {string|undefined} inviteCode - From the sign-up request
 * @returns {{ allowed: true } | { allowed: false, code: string, message: string }}
 */
function checkRegistration(inviteCode) {
  const mode = registrationMode();
  if (mode === 'open') return { allowed: true };
  if (mode === 'invite' && inviteCodeMatches(inviteCode)) return { allowed: true };

  return mode === 'invite'
    ? { allowed: false, code: 'INVALID_INVITE_CODE', message: 'That invite code is not valid.' }
    : { allowed: false, code: 'REGISTRATION_CLOSED', message: 'Sign-up is closed.' };
}

module.exports = { registrationMode, checkRegistration };

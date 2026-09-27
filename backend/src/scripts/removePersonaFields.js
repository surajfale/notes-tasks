/**
 * One-off cleanup: remove the retired persona fields (uiPersona,
 * personaOnboarded) from existing User documents.
 *
 * They're harmless if left (no longer in the schema, so Mongoose ignores
 * them), this just keeps the collection tidy. Dry run by default: it only
 * reports how many users still carry the fields. Pass --apply to unset them.
 * Idempotent — safe to re-run.
 *
 * Usage:
 *   node src/scripts/removePersonaFields.js           # dry run
 *   node src/scripts/removePersonaFields.js --apply   # actually unset
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const RETIRED_FIELDS = ['uiPersona', 'personaOnboarded'];

// Matches any user that still has at least one retired field.
const FILTER = { $or: RETIRED_FIELDS.map((field) => ({ [field]: { $exists: true } })) };
const UNSET = Object.fromEntries(RETIRED_FIELDS.map((field) => [field, '']));

/**
 * @param {{ apply: boolean }} options
 * @returns {Promise<{ matched: number, modified: number }>}
 */
async function removePersonaFields({ apply }) {
  // Raw collection access: the fields aren't in the schema anymore, so a
  // Mongoose query with strict filtering would silently drop them from the
  // filter and match every user.
  const users = User.collection;
  const matched = await users.countDocuments(FILTER);

  if (!apply || matched === 0) {
    return { matched, modified: 0 };
  }

  const result = await users.updateMany(FILTER, { $unset: UNSET });
  return { matched, modified: result.modifiedCount };
}

async function main() {
  const apply = process.argv.includes('--apply');

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const { matched, modified } = await removePersonaFields({ apply });

    if (!apply) {
      console.log(`[dry run] ${matched} user(s) still have ${RETIRED_FIELDS.join('/')}.`);
      if (matched > 0) console.log('Re-run with --apply to remove them.');
    } else {
      console.log(`Removed ${RETIRED_FIELDS.join('/')} from ${modified} of ${matched} user(s).`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });
}

module.exports = { removePersonaFields, RETIRED_FIELDS };

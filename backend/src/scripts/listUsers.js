/**
 * List every account, to spot sign-ups you didn't authorize.
 *
 * Read-only: prints each user's username, email, display name, when they
 * signed up, and how many notes / tasks / lists they own (an account with
 * data is one someone is actually using). Newest first. Never prints
 * password hashes or reset tokens, and never changes or deletes anything.
 *
 * Usage:
 *   node src/scripts/listUsers.js           # table
 *   node src/scripts/listUsers.js --json    # machine-readable
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Note = require('../models/Note');
const Task = require('../models/Task');
const List = require('../models/List');

async function countByUser(Model) {
  const rows = await Model.aggregate([{ $group: { _id: '$userId', count: { $sum: 1 } } }]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

/**
 * @returns {Promise<Array<{ username, email, displayName, createdAt, notes, tasks, lists }>>}
 */
async function listUsers() {
  const [users, notes, tasks, lists] = await Promise.all([
    User.find({}, { username: 1, email: 1, displayName: 1, createdAt: 1 }).sort({ createdAt: -1 }).lean(),
    countByUser(Note),
    countByUser(Task),
    countByUser(List),
  ]);

  return users.map((user) => {
    const id = String(user._id);
    return {
      username: user.username,
      email: user.email,
      displayName: user.displayName || '',
      createdAt: user.createdAt,
      notes: notes.get(id) || 0,
      tasks: tasks.get(id) || 0,
      lists: lists.get(id) || 0,
    };
  });
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const users = await listUsers();

    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(users, null, 2));
      return;
    }

    console.log(`${users.length} account(s), newest first:\n`);
    console.table(
      users.map((u) => ({
        ...u,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString().replace('T', ' ').slice(0, 16) : '',
      }))
    );
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to list users:', error);
    process.exit(1);
  });
}

module.exports = { listUsers };

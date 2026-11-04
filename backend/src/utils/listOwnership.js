const List = require('../models/List');

/**
 * Whether `listId` is empty (no list) or names a list owned by `userId`.
 * Notes/tasks/links must never point at another account's list.
 * @param {string|null|undefined} listId
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @returns {Promise<boolean>}
 */
async function listBelongsToUser(listId, userId) {
  if (!listId) return true;
  return Boolean(await List.exists({ _id: listId, userId }));
}

// Same shape as the controllers' other 404s; doesn't reveal whether the
// list exists under someone else's account.
const listNotFound = (res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'List not found' } });

module.exports = { listBelongsToUser, listNotFound };

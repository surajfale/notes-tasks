/**
 * Helpers for req.query values. Query strings can carry arrays (?a=1&a=2)
 * and, with an extended parser, objects (?a[$ne]=x), both of which would
 * flow into Mongo filters as operators. Read every query param through
 * queryString() so only plain strings get through.
 */

/** @returns {string|undefined} the value if it is a non-empty string */
const queryString = (value) => (typeof value === 'string' && value.length > 0 ? value : undefined);

/** Escape a string for literal use inside a RegExp / $regex. */
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { queryString, escapeRegex };

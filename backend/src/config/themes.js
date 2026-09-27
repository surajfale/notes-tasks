/**
 * Color themes the frontend offers (frontend/src/lib/stores/theme.ts
 * THEME_PALETTES). Shared by the User model enum and the Joi validator so the
 * two can't drift apart.
 */
const THEME_PALETTES = ['aurora', 'ember', 'lagoon'];
const DEFAULT_THEME_PALETTE = 'aurora';

module.exports = { THEME_PALETTES, DEFAULT_THEME_PALETTE };

const express = require('express');
const router = express.Router();
const {
  getPreferences,
  updatePreferences,
  updatePushSubscription,
  removePushSubscription,
  getVapidPublicKey,
  unsubscribeByToken
} = require('../controllers/notificationsController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { publicLimiter, deepLinkLimiter } = require('../middleware/rateLimiters');

// Public routes (no authentication required)
router
  .route('/vapid-public-key')
  .get(publicLimiter, getVapidPublicKey);

// Email footer "unsubscribe" link: authenticated by the signed token in the
// URL, not a session (see unsubscribeByToken).
router.post('/unsubscribe/:token', deepLinkLimiter, unsubscribeByToken);

// Protected routes (authentication required)
router.use(protect);

router
  .route('/preferences')
  .get(getPreferences)
  .put(validate(schemas.updateNotificationPreferences), updatePreferences);

router
  .route('/push-subscription')
  .put(updatePushSubscription)
  .delete(removePushSubscription);

module.exports = router;
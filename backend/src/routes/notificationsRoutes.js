const express = require('express');
const router = express.Router();
const {
  getPreferences,
  updatePreferences,
  updatePushSubscription,
  removePushSubscription,
  getVapidPublicKey
} = require('../controllers/notificationsController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Public routes (no authentication required)
router
  .route('/vapid-public-key')
  .get(getVapidPublicKey);

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
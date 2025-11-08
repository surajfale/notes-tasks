const webPush = require('web-push');

/**
 * Generate VAPID keys for Web Push notifications
 * Run this script once to generate keys, then add them to your .env file
 */
function generateVapidKeys() {
  console.log('Generating VAPID keys for Web Push notifications...\n');

  const vapidKeys = webPush.generateVAPIDKeys();

  console.log('VAPID Keys generated successfully!\n');
  console.log('Add these to your .env file:\n');
  console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
  console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
  console.log('\nAlso add your contact email:');
  console.log('VAPID_SUBJECT=mailto:your-email@example.com');
  console.log('\nNote: Keep the private key secret and never commit it to version control!');
}

// Run if called directly
if (require.main === module) {
  generateVapidKeys();
}

module.exports = { generateVapidKeys };

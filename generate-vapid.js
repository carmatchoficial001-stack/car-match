
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Paste these in your .env file:');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);

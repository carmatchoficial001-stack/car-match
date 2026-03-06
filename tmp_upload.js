
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

async function run() {
    try {
        console.log('Starting upload...');
        const res = await cloudinary.uploader.upload('e:/carmatchapp/public/icon-512-v20.png', {
            public_id: 'carmatch_logo_v20',
            folder: 'carmatch/branding',
            overwrite: true
        });
        console.log('DONE:', res.secure_url);
    } catch (e) {
        console.error('ERROR:', e.message);
    }
}
run();

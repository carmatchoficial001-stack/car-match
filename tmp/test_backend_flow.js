const { chatWithImageDirector, processNextImageBatch } = require('../src/app/admin/actions/image-chat-actions');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFlow() {
    console.log('--- STARTING FLOW TEST ---');

    // Find a real user to use for auth simulation (since actions call auth())
    // Note: This script will still fail at auth() because it's not a real request.
    // I will modify the script to bypass auth or just inspect why it fails.

    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('No users found in DB');
        return;
    }

    console.log(`Using User: ${user.email} (${user.id})`);

    try {
        console.log('\n1. Testing chatWithImageDirector...');
        // We need to mock the environment as if it's a server action
        const result = await chatWithImageDirector(
            [{ role: 'user', content: 'Una foto de un Ferrari rojo en CDMX' }],
            undefined, // conversationId
            'MX'
        );

        console.log('Chat Result:', JSON.stringify(result, null, 2));

        if (result.success && result.messageId) {
            console.log('\n2. Testing processNextImageBatch...');
            const batchRes = await processNextImageBatch(result.messageId);
            console.log('Batch Result:', JSON.stringify(batchRes, null, 2));
        }
    } catch (e) {
        console.error('FLOW ERROR:', e);
    }
}

testFlow()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

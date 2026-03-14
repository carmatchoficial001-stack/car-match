
async function main() {
    const url = 'https://carmatchapp.net/api/studio/webhook?postId=test-manual&format=vertical&idx=0';
    console.log(`🚀 Sending manual POST to ${url}...`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: "OK",
                payload: { images: [{ url: "https://example.com/test.jpg" }] },
                metadata: { postId: "test-manual", idx: 0, format: "vertical" }
            })
        });
        console.log(`✅ Status: ${res.status}`);
        const text = await res.text();
        console.log(`📄 Response: ${text}`);
    } catch (e: any) {
        console.error(`💥 Error: ${e.message}`);
    }
}
main();

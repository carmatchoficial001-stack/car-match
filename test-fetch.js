async function test() {
    try {
        const imageUrl = `https://image.pollinations.ai/prompt/test?model=flux&seed=1245&nologo=true`;
        console.log('[FETCH] URL:', imageUrl);

        const imgRes = await fetch(imageUrl);
        console.log('STATUS:', imgRes.status);
        console.log('CONTENT-TYPE:', imgRes.headers.get('content-type'));

        const text = await imgRes.text();
        console.log('PAYLOAD PREVIEW:', text.substring(0, 100));
    } catch (err) {
        console.error('ERROR:', err);
    }
}
test();

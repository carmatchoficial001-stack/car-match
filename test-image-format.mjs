async function test() {
    const prompt = 'A beautiful red sports car, studio lighting';
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=400&model=flux&nologo=true`;
    console.log('Fetching', imageUrl);
    const res = await fetch(imageUrl);
    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));

    const arrayBuffer = await res.arrayBuffer();
    console.log('Size:', arrayBuffer.byteLength);
    const buffer = Buffer.from(arrayBuffer);

    // Check first bytes for image format
    const hex = buffer.subarray(0, 16).toString('hex');
    console.log('Magic Bytes:', hex);

    if (hex.startsWith('ffd8ff')) console.log('Format: JPEG');
    else if (hex.startsWith('89504e47')) console.log('Format: PNG');
    else if (hex.includes('57454250')) console.log('Format: WEBP');
    else console.log('Format: Unknown');
}
test();

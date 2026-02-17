import Replicate from 'replicate'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const runDebug = async () => {
    console.log('--- STARTING REPLICATE DEBUG ---')

    const token = process.env.REPLICATE_API_TOKEN

    if (!token) {
        console.error('❌ ERROR: REPLICATE_API_TOKEN is missing in .env')
        return
    }

    console.log(`✅ Token found: ${token.substring(0, 5)}...`)

    const replicate = new Replicate({
        auth: token,
    })

    // TEST 1: FLUX SCHNELL (Images)
    console.log('\n--- TESTING FLUX SCHNELL ---')
    try {
        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: "A futuristic tesla car in mexico city, 8k",
                    aspect_ratio: "1:1",
                    go_fast: true,
                    megapixels: "1"
                }
            }
        )
        console.log('📸 RAW FLUX OUTPUT:', JSON.stringify(output, null, 2))
    } catch (error) {
        console.error('❌ FLUX ERROR:', error)
    }

    // TEST 2: KLING / LUMA (Video)
    console.log('\n--- TESTING VIDEO GENERATION ---')
    try {
        // Trying a known working model path for Minimax or Luma if Kling fails
        // Let's try Minimax first as it's often more reliable publically
        console.log('Attempting Replicate standard model...')
        const output = await replicate.run(
            "kwaivgi/kling-v1.6-pro",
            {
                input: {
                    prompt: "Cinematic shot of a red car driving fast",
                    duration: 5
                }
            }
        )
        console.log('🎥 RAW VIDEO OUTPUT:', JSON.stringify(output, null, 2))
    } catch (error) {
        console.error('❌ VIDEO ERROR:', error)
    }
}

runDebug()

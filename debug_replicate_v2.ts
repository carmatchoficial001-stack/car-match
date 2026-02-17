import Replicate from 'replicate'
import dotenv from 'dotenv'
import fs from 'fs'

// Load environment variables
dotenv.config()

const runDebug = async () => {
    console.log('--- STARTING REPLICATE DEBUG V2 ---')

    const token = process.env.REPLICATE_API_TOKEN

    if (!token) {
        console.error('❌ ERROR: REPLICATE_API_TOKEN is missing in .env')
        return
    }

    const replicate = new Replicate({
        auth: token,
    })

    // TEST: Flux Schnell (Image)
    console.log('\n--- TESTING FLUX SCHNELL ---')
    try {
        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: "A futuristic tesla car in mexico city, 8k",
                    aspect_ratio: "1:1",
                    go_fast: true,
                    megapixels: "1",
                    output_format: "jpg"
                }
            }
        )

        console.log('TYPE OF OUTPUT:', typeof output)
        console.log('IS ARRAY?', Array.isArray(output))
        console.log('RAW OUTPUT:', output)

        fs.writeFileSync('debug_flux_output.json', JSON.stringify(output, null, 2))
        console.log('Saved output to debug_flux_output.json')

    } catch (error) {
        console.error('❌ FLUX ERROR:', error)
    }

    // TEST: Kling / Minimax (Video)
    console.log('\n--- TESTING VIDEO ---')
    try {
        const output = await replicate.run(
            "kwaivgi/kling-v1.6-pro",
            {
                input: {
                    prompt: "Cinematic shot of a red car driving fast",
                    duration: 5
                }
            }
        )

        console.log('TYPE OF OUTPUT:', typeof output)
        console.log('IS ARRAY?', Array.isArray(output))
        console.log('RAW OUTPUT:', output)

        fs.writeFileSync('debug_video_output.json', JSON.stringify(output, null, 2))
        console.log('Saved output to debug_video_output.json')

    } catch (error) {
        console.error('❌ VIDEO ERROR:', error)
    }
}

runDebug()

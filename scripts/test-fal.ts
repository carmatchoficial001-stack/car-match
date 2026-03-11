
async function testFal() {
  const falKey = "1b585e9c-4a0a-47b2-bee8-5ba43c1c4717:7b7327f1157785420569bed8fe7d8c96"
  console.log("Testing FAL_KEY...")
  
  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: "A futuristic car in a neon city, cyberpunk style",
        image_size: { width: 512, height: 512 },
        num_inference_steps: 4
      })
    })
    
    if (response.ok) {
        const data = await response.json()
        console.log("SUCCESS! Image URL:", data.images?.[0]?.url)
    } else {
        const err = await response.text()
        console.error("FAL API ERROR:", response.status, err)
    }
  } catch (e: any) {
    console.error("FETCH ERROR:", e.message)
  }
}

testFal()

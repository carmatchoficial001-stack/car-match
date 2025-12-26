from PIL import Image

def process_logo(path, dest_path, dest_size=None, zoom_factor=1.85):
    try:
        print(f"Processing {path} -> {dest_path}...")
        img = Image.open(path).convert("RGBA")
        width, height = img.size
        
        # 1. Apply Zoom/Crop (1.85x to cut white corners)
        crop_width = width / zoom_factor
        crop_height = height / zoom_factor
        left = (width - crop_width) / 2
        top = (height - crop_height) / 2
        right = left + crop_width
        bottom = top + crop_height
        
        img = img.crop((left, top, right, bottom))
        img = img.resize((width, height), Image.Resampling.LANCZOS)
        
        # 2. Make Background Transparent
        # Get the color of the top-left corner (assuming it's the background)
        datas = img.getdata()
        newData = []
        # Background color to remove (approximate dark blue)
        # We use a tolerance because of compression artifacts
        bg_sample = datas[0] # (r, g, b, a)
        
        # If the sample is transparent already, default to replacing dark blue
        if bg_sample[3] == 0:
            bg_target = (15, 23, 42) # #0f172a
        else:
            bg_target = bg_sample

        for item in datas:
            # Check if color is close to the background color (Dark Blue / Blackish)
            # Increased tolerance to capture compression artifacts and gradients
            if (item[0] < 40 and item[1] < 50 and item[2] < 70):
                newData.append((0, 0, 0, 0)) # Transparent
            elif (abs(item[0] - bg_target[0]) < 40 and 
                abs(item[1] - bg_target[1]) < 40 and 
                abs(item[2] - bg_target[2]) < 40):
                newData.append((0, 0, 0, 0)) # Transparent
            else:
                newData.append(item)
                
        img.putdata(newData)
        
        # 3. Resize if needed
        if dest_size:
            img = img.resize(dest_size, Image.Resampling.LANCZOS)
            
        img.save(dest_path, "PNG")
        print(f"Saved transparent image to {dest_path}")
        
    except Exception as e:
        print(f"Error processing {path}: {e}")

paths = [
    ("e:/carmatch/public/logo.png", "e:/carmatch/public/logo-v3.png", None),
    ("e:/carmatch/public/logo.png", "e:/carmatch/public/icon-192-v3.png", (192, 192)),
    ("e:/carmatch/public/logo.png", "e:/carmatch/public/icon-512-v3.png", (512, 512))
]

for src, dest, size in paths:
    process_logo(src, dest, dest_size=size)

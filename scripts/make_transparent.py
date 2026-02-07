from PIL import Image
import os

def process_image(input_path, output_path, bg_color=None):
    if not os.path.exists(input_path):
        print(f"Skipping: {input_path} (not found)")
        return
    
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # Detect white background (using a threshold to catch near-whites)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            if bg_color:
                # Replace with specific background color (opaque)
                newData.append((*bg_color, 255))
            else:
                # Make truly transparent
                newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Created: {output_path}")

# App background color #0f172a -> (15, 23, 42)
APP_BG = (15, 23, 42)
public_path = r"e:\carmatchapp\public"

# 1. Create Transparent versions (for Browser Favicons)
process_image(os.path.join(public_path, "favicon-v18.png"), os.path.join(public_path, "favicon-v19.png"))
process_image(os.path.join(public_path, "icon-192-v18.png"), os.path.join(public_path, "icon-192-v19.png"))
process_image(os.path.join(public_path, "icon-512-v18.png"), os.path.join(public_path, "icon-512-v19.png"))
process_image(os.path.join(public_path, "maskable-192-v18.png"), os.path.join(public_path, "maskable-192-v19.png"))
process_image(os.path.join(public_path, "maskable-512-v18.png"), os.path.join(public_path, "maskable-512-v19.png"))

# 2. Create version with App BG color (for social share / og:image)
# This ensures it looks perfect even if the platform doesn't support transparency
process_image(os.path.join(public_path, "logo-v18.png"), os.path.join(public_path, "logo-v19.png"), bg_color=APP_BG)

from PIL import Image
import os
import math

def distance(c1, c2):
    (r1,g1,b1) = c1
    (r2,g2,b2) = c2
    return math.sqrt((r1 - r2)**2 + (g1 - g2)**2 + (b1 - b2)**2)

def create_icon_v6(source_path, output_path, size, bg_color_hex):
    print(f"Processing {source_path} to {output_path}...")
    try:
        img = Image.open(source_path).convert("RGBA")
        
        # Parse hex color
        bg_color_hex = bg_color_hex.lstrip('#')
        bg_rgb = tuple(int(bg_color_hex[i:i+2], 16) for i in (0, 2, 4))
        bg_rgba = bg_rgb + (255,)

        datas = img.getdata()
        new_data = []
        
        # Replace white parts with background color (or transparent)
        # Assuming white is the unwanted color in windows/lights
        # Threshold for "white"
        threshold = 200 
        
        for item in datas:
            # item is (r,g,b,a)
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                # This is a light/white pixel. 
                # If we make it transparent, it will show the dark background when pasted.
                # If the original logo had white windows, they will now become dark.
                new_data.append((0, 0, 0, 0)) # Make transparent
            else:
                new_data.append(item)

        img.putdata(new_data)

        # Create background
        background = Image.new("RGBA", (size, size), bg_rgba)
        
        # Resize logo with MORE padding (70% of size -> 30% padding total, 15% each side)
        # This helps with "fit in the box" (adaptive icons)
        target_scale = 0.65 # Safe zone for adaptive icons is circle diameter = 72dp within 108dp (approx 66%)
        target_size = int(size * target_scale)
        
        # Resize maintaining aspect ratio
        img.thumbnail((target_size, target_size), Image.Resampling.LANCZOS)
        
        # Center
        bg_w, bg_h = background.size
        img_w, img_h = img.size
        offset = ((bg_w - img_w) // 2, (bg_h - img_h) // 2)
        
        background.paste(img, offset, img)
        background.save(output_path)
        print(f"Saved {output_path}")

    except Exception as e:
        print(f"Error: {e}")

# Try to find the best source
sources = ["public/logo.png", "public/logo-v3.png"]
source_file = None
for s in sources:
    if os.path.exists(s):
        source_file = s
        break

if source_file:
    # Color #0f172a
    create_icon_v6(source_file, "public/icon-512-v6.png", 512, "#0f172a")
    create_icon_v6(source_file, "public/icon-192-v6.png", 192, "#0f172a")
else:
    print("No source logo found!")

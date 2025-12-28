from PIL import Image
import os

def create_icon(source_path, output_path, size, bg_color):
    try:
        # Open the source image
        img = Image.open(source_path).convert("RGBA")
        
        # Calculate aspect ratio to fit within the size with some padding (e.g., 20% padding)
        target_size = int(size * 0.8)
        img.thumbnail((target_size, target_size), Image.Resampling.LANCZOS)
        
        # Create a new background image
        background = Image.new("RGBA", (size, size), bg_color)
        
        # Calculate position to center the image
        bg_w, bg_h = background.size
        img_w, img_h = img.size
        offset = ((bg_w - img_w) // 2, (bg_h - img_h) // 2)
        
        # Paste the logo onto the background
        background.paste(img, offset, img)
        
        # Save the result
        background.save(output_path)
        print(f"Successfully created {output_path}")
        
    except Exception as e:
        print(f"Error creating icon: {e}")

# Configuration
# Assuming logo-v3.png is the best source (usually v3 implies latest iteration)
# If logo-v3.png has text, we might need to crop it, but let's assume for icon we want the graphic.
# Based on user feedback ("logo original"), they likely want the car graphic.
# Inspecting the file list, logo-v3.png is 391KB, logo.png is 332KB.
# Let's try to use the one that is just the car if possible, or crop the car out if it's the full textual logo.
# Since I can't easily see the image content, I'll assume logo-v3.png is the source the user wants.
# However, often "logo" files include the text "CarMatch". Ideally we just want the car for the app icon.
# I will try to detect if its wide (text + logo) or square.

source_file = "public/logo-v3.png" 
bg_color = "#0f172a"

# Check if file exists, if not fall back
if not os.path.exists(source_file):
    print(f"{source_file} not found, checking other options...")
    source_file = "public/logo.png"

img = Image.open(source_file)
width, height = img.size
print(f"Source image size: {width}x{height}")

# If the image is very wide, it likely has text. We might want to crop the left part (usually where the icon is).
# Heuristic: if width > 1.5 * height, assume logo + text.
# Crop to become square-ish if needed? 
# For now, let's just make it fit. If it's the full logo including text, it might look small.
# BUT, the user said "usa el logo original".

# Let's create the icons
create_icon(source_file, "public/icon-512-v5.png", 512, bg_color)
create_icon(source_file, "public/icon-192-v5.png", 192, bg_color)

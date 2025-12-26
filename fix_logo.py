from PIL import Image, ImageDraw

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

TARGET_COLOR = hex_to_rgb("#0f172a")

def fix_image(path):
    try:
        print(f"Processing {path}...")
        img = Image.open(path).convert("RGBA")
        width, height = img.size
        
        # Check top-left pixel to verify it's the target to fill
        # If it's already dark, we might not need to do anything or it might be transparent?
        # But we force fill to ensure uniformity.
        
        draw = ImageDraw.Draw(img)
        fill_color = TARGET_COLOR + (255,)
        
        # Use a generous threshold to catch antialiasing artifacts near the border
        thresh_val = 100 
        
        # Fill from all 4 corners
        ImageDraw.floodfill(img, (0, 0), fill_color, thresh=thresh_val)
        ImageDraw.floodfill(img, (width-1, 0), fill_color, thresh=thresh_val)
        ImageDraw.floodfill(img, (0, height-1), fill_color, thresh=thresh_val)
        ImageDraw.floodfill(img, (width-1, height-1), fill_color, thresh=thresh_val)
        
        img.save(path)
        print(f"Saved {path}")
    except Exception as e:
        print(f"Error processing {path}: {e}")

paths = [
    "e:/carmatch/public/logo.png",
    "e:/carmatch/public/icon-192.png",
    "e:/carmatch/public/icon-512.png"
]

for p in paths:
    fix_image(p)

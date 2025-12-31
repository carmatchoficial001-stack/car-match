from PIL import Image
import os

def process_logo(src_path, dest_path, dest_size=None, zoom_factor=1.85, fill_bg=True, logo_scale=0.85):
    try:
        if not os.path.exists(src_path):
            print(f"Error: No se encuentra el archivo origen en {src_path}")
            return

        print(f"Procesando {src_path} -> {dest_path}...")
        img = Image.open(src_path).convert("RGBA")
        width, height = img.size
        
        # 1. Extraer el logo (Zoom)
        crop_width = width / zoom_factor
        crop_height = height / zoom_factor
        left = (width - crop_width) / 2
        top = (height - crop_height) / 2
        right = left + crop_width
        bottom = top + crop_height
        
        img = img.crop((left, top, right, bottom))
        img = img.resize((width, height), Image.Resampling.LANCZOS)
        
        # 2. Limpieza agresiva de fondos originales
        datas = img.getdata()
        newData = []
        for item in datas:
            r, g, b, a = item
            # Quitar blanco y el azul oscuro viejo
            if (r > 210 and g > 210 and b > 210) or (r < 80 and g < 90 and b < 110):
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)
        img.putdata(newData)
        
        # 3. Composición
        brand_color = (15, 23, 42) # #0f172a
        
        if dest_size:
            target_w, target_h = dest_size
            if fill_bg:
                # SÓLIDO PARA MASKABLE (Android Home Screen)
                final_img = Image.new("RGB", dest_size, brand_color)
            else:
                # TRANSPARENTE PARA WEB/SHORTCUTS
                final_img = Image.new("RGBA", dest_size, (0, 0, 0, 0))
            
            logo_w = int(target_w * logo_scale)
            logo_h = int(target_h * logo_scale)
            logo_resized = img.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
            
            offset_x = (target_w - logo_w) // 2
            offset_y = (target_h - logo_h) // 2
            
            final_img.paste(logo_resized, (offset_x, offset_y), logo_resized)
            final_img.save(dest_path, "PNG")
        else:
            final_img = Image.new("RGBA", img.size, (0, 0, 0, 0))
            final_img.paste(img, (0, 0), img)
            final_img.save(dest_path, "PNG")
            
        print(f"✅ Guardado: {dest_path}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

# Configuración v17
BASE_DIR = "e:/carmatchapp"
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
SRC_LOGO = os.path.join(PUBLIC_DIR, "logo.png")

jobs = [
    # Web / UI (Ahora con fondo sólido para evitar marcos blancos en lanzadores)
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "logo-v17.png"), None, False, 1.0),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "favicon-v17.png"), (32, 32), False, 1.0),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "icon-192-v17.png"), (192, 192), True, 0.85),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "icon-512-v17.png"), (512, 512), True, 0.85),
    
    # Adaptive / Maskable (Sólidos para evitar círculo blanco)
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "maskable-192-v17.png"), (192, 192), True, 0.85),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "maskable-512-v17.png"), (512, 512), True, 0.85)
]

if __name__ == "__main__":
    print("🚀 Generando iconos CarMatch v17 (ULTRA CACHE BUSTER)...")
    for src, dest, size, fill, scale in jobs:
        process_logo(src, dest, dest_size=size, fill_bg=fill, logo_scale=scale)
    print("✨ Proceso completado.")

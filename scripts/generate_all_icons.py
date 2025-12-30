from PIL import Image
import os

def process_logo(src_path, dest_path, dest_size=None, zoom_factor=1.85, fill_bg=False):
    try:
        if not os.path.exists(src_path):
            print(f"Error: No se encuentra el archivo origen en {src_path}")
            return

        print(f"Procesando {src_path} -> {dest_path}...")
        img = Image.open(src_path).convert("RGBA")
        width, height = img.size
        
        # 1. Aplicar Zoom/Crop para el logo original
        crop_width = width / zoom_factor
        crop_height = height / zoom_factor
        left = (width - crop_width) / 2
        top = (height - crop_height) / 2
        right = left + crop_width
        bottom = top + crop_height
        
        img = img.crop((left, top, right, bottom))
        img = img.resize((width, height), Image.Resampling.LANCZOS)
        
        # 2. Limpieza de fondo del logo
        datas = img.getdata()
        newData = []
        for item in datas:
            r, g, b, a = item
            # Eliminar fondos blancos o muy claros
            is_white = (r > 200 and g > 200 and b > 200)
            # Eliminar el azul oscuro original si existe
            is_brand_dark = (r < 70 and g < 80 and b < 100)
            
            if is_white or is_brand_dark:
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)
        
        img.putdata(newData)
        
        # 3. Composición final
        brand_color = (15, 23, 42) # #0f172a (RGB sólido)
        
        if dest_size:
            target_w, target_h = dest_size
            if fill_bg:
                # CREAMOS UNA IMAGEN RGB SÓLIDA para forzar que sea el fondo completo
                # Sin canal alfa para asegurar compatibilidad con adaptive icons de Android
                final_img = Image.new("RGB", dest_size, brand_color)
            else:
                final_img = Image.new("RGBA", dest_size, (0, 0, 0, 0))
            
            # Logo más grande (90%) para cubrir mejor el área
            logo_scale = 0.9 if fill_bg else 1.0
            logo_w = int(target_w * logo_scale)
            logo_h = int(target_h * logo_scale)
            
            logo_resized = img.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
            
            # Pegar el logo en el centro
            offset_x = (target_w - logo_w) // 2
            offset_y = (target_h - logo_h) // 2
            
            if fill_bg:
                # Pegar usando el canal alfa del logo como máscara sobre el fondo RGB
                final_img.paste(logo_resized, (offset_x, offset_y), logo_resized)
            else:
                final_img.paste(logo_resized, (offset_x, offset_y), logo_resized)
            
            final_img.save(dest_path, "PNG")
        else:
            img.save(dest_path, "PNG")
            
        print(f"✅ Guardado: {dest_path}")
        
    except Exception as e:
        print(f"❌ Error procesando {dest_path}: {e}")

# Rutas
BASE_DIR = "e:/carmatchapp"
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
SRC_LOGO = os.path.join(PUBLIC_DIR, "logo.png")

jobs = [
    # v12: Máximo tamaño (90%) y Fondo RGB Sólido (Sin Alpha) para móviles
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "logo-v12.png"), None, False),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "favicon-v12.png"), (32, 32), False),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "icon-192-v12.png"), (192, 192), True),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "icon-512-v12.png"), (512, 512), True)
]

if __name__ == "__main__":
    print("🚀 Generando iconos CarMatch v12 (Fondo Sólido RGB + Logo 90%)...")
    for src, dest, size, fill in jobs:
        process_logo(src, dest, dest_size=size, fill_bg=fill)
    print("✨ Proceso completado.")

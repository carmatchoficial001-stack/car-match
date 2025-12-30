from PIL import Image
import os

def process_logo(src_path, dest_path, dest_size=None, zoom_factor=1.85, fill_bg=False, logo_scale=0.65):
    try:
        if not os.path.exists(src_path):
            print(f"Error: No se encuentra el archivo origen en {src_path}")
            return

        print(f"Procesando {src_path} -> {dest_path}...")
        img = Image.open(src_path).convert("RGBA")
        width, height = img.size
        
        # 1. Aplicar Zoom/Crop para el logo original (extraer solo el carrito/texto)
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
            is_white = (r > 210 and g > 210 and b > 210)
            # Eliminar el azul oscuro original si existe
            is_brand_dark = (r < 80 and g < 90 and b < 110)
            
            if is_white or is_brand_dark:
                newData.append((0, 0, 0, 0))
            else:
                newData.append(item)
        
        img.putdata(newData)
        
        # 3. Composición final
        brand_color = (15, 23, 42) # #0f172a
        
        if dest_size:
            target_w, target_h = dest_size
            if fill_bg:
                # IMAGEN RGB SÓLIDA PARA MASKABLE (Android requiere fondo completo)
                final_img = Image.new("RGB", dest_size, brand_color)
            else:
                # IMAGEN TRANSPARENTE PARA WEB/FAVICON
                final_img = Image.new("RGBA", dest_size, (0, 0, 0, 0))
            
            # Ajustar escala (0.65 es el estándar para Maskable Icons "Safe Zone")
            logo_w = int(target_w * logo_scale)
            logo_h = int(target_h * logo_scale)
            
            logo_resized = img.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
            
            # Pegar el logo en el centro
            offset_x = (target_w - logo_w) // 2
            offset_y = (target_h - logo_h) // 2
            
            # Usar el logo limpio como máscara
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

# Tareas para v13
jobs = [
    # 1. Logo principal transparente para la web
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "logo-v13.png"), None, False, 1.0),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "favicon-v13.png"), (32, 32), False, 1.0),
    
    # 2. Iconos normales (para cualquier uso, transparentes)
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "icon-192-v13.png"), (192, 192), False, 0.85),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "icon-512-v13.png"), (512, 512), False, 0.85),
    
    # 3. MASKABLE ICONS (Sólidos, logo en Safe Zone 65% para Android/iOS)
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "maskable-192-v13.png"), (192, 192), True, 0.65),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "maskable-512-v13.png"), (512, 512), True, 0.65)
]

if __name__ == "__main__":
    print("🚀 Generando iconos CarMatch v13 (Professional Maskable Icons & Clean Logo)...")
    for src, dest, size, fill, scale in jobs:
        process_logo(src, dest, dest_size=size, fill_bg=fill, logo_scale=scale)
    print("✨ Proceso completado.")

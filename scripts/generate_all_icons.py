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
        
        # 1. Aplicar Zoom/Crop para eliminar bordes lejanos del logo original
        crop_width = width / zoom_factor
        crop_height = height / zoom_factor
        left = (width - crop_width) / 2
        top = (height - crop_height) / 2
        right = left + crop_width
        bottom = top + crop_height
        
        img = img.crop((left, top, right, bottom))
        img = img.resize((width, height), Image.Resampling.LANCZOS)
        
        # 2. Limpiar el fondo del logo (hacerlo transparente)
        # Vamos a eliminar tanto lo MUY BLANCO como lo MUY OSCURO que no sea parte del logo
        datas = img.getdata()
        newData = []
        
        for item in datas:
            r, g, b, a = item
            # Detectar blanco o gris muy claro (fondo residual)
            is_white = (r > 200 and g > 200 and b > 200)
            # Detectar el azul oscuro original (#0f172a) o negro
            is_brand_dark = (r < 60 and g < 70 and b < 90)
            
            if is_white or is_brand_dark:
                newData.append((0, 0, 0, 0)) # Completamente transparente
            else:
                newData.append(item)
                
        img.putdata(newData)
        
        # 3. Composición final
        brand_color = (15, 23, 42, 255) # #0f172a
        
        if dest_size:
            target_w, target_h = dest_size
            # Crear lienzo final
            if fill_bg:
                final_img = Image.new("RGBA", dest_size, brand_color)
            else:
                final_img = Image.new("RGBA", dest_size, (0, 0, 0, 0))
            
            # Redimensionar el logo limpio para que quepa en el lienzo con un margen de seguridad
            # Los iconos adaptativos de Android usan el centro 66% como zona segura
            logo_scale = 0.8 if fill_bg else 1.0
            logo_w = int(target_w * logo_scale)
            logo_h = int(target_h * logo_scale)
            
            logo_resized = img.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
            
            # Pegar el logo en el centro
            offset_x = (target_w - logo_w) // 2
            offset_y = (target_h - logo_h) // 2
            final_img.paste(logo_resized, (offset_x, offset_y), logo_resized)
            
            final_img.save(dest_path, "PNG")
        else:
            # Para el logo principal, solo guardamos el transparente limpio
            img.save(dest_path, "PNG")
            
        print(f"✅ Guardado: {dest_path}")
        
    except Exception as e:
        print(f"❌ Error procesando {dest_path}: {e}")

# Rutas absolutas
BASE_DIR = "e:/carmatchapp"
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
SRC_LOGO = os.path.join(PUBLIC_DIR, "logo.png")

jobs = [
    # Versión v11: Limpieza total de blanco y negro + fondo sólido para móviles
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "logo-v11.png"), None, False),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "favicon-v11.png"), (32, 32), False),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "icon-192-v11.png"), (192, 192), True),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "icon-512-v11.png"), (512, 512), True)
]

if __name__ == "__main__":
    print("🚀 Iniciando generación de iconos CarMatch v11 (Limpieza Total)...")
    for src, dest, size, fill in jobs:
        process_logo(src, dest, dest_size=size, fill_bg=fill)
    print("✨ Proceso completado.")

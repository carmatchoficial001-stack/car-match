from PIL import Image
import os

def process_logo(src_path, dest_path, dest_size=None, zoom_factor=1.85):
    try:
        if not os.path.exists(src_path):
            print(f"Error: No se encuentra el archivo origen en {src_path}")
            return

        print(f"Procesando {src_path} -> {dest_path}...")
        img = Image.open(src_path).convert("RGBA")
        width, height = img.size
        
        # 1. Aplicar Zoom/Crop para eliminar bordes blancos
        crop_width = width / zoom_factor
        crop_height = height / zoom_factor
        left = (width - crop_width) / 2
        top = (height - crop_height) / 2
        right = left + crop_width
        bottom = top + crop_height
        
        img = img.crop((left, top, right, bottom))
        
        # 2. Hacer el fondo transparente
        datas = img.getdata()
        newData = []
        
        # El color de fondo es aproximadamente #0f172a (15, 23, 42)
        # Vamos a ser un poco más agresivos para capturar bordes
        for item in datas:
            # Si el pixel es muy oscuro, lo hacemos transparente
            # r<60, g<70, b<90 para capturar variaciones del azul oscuro
            if (item[0] < 60 and item[1] < 70 and item[2] < 90):
                newData.append((0, 0, 0, 0)) # Transparente
            else:
                newData.append(item)
                
        img.putdata(newData)
        
        # 3. Redimensionar al tamaño final
        if dest_size:
            img = img.resize(dest_size, Image.Resampling.LANCZOS)
        else:
            # Si no hay tamaño destino, mantenemos el original pero optimizado
            img = img.resize((width, height), Image.Resampling.LANCZOS)
            
        img.save(dest_path, "PNG")
        print(f"✅ Guardado: {dest_path}")
        
    except Exception as e:
        print(f"❌ Error procesando {dest_path}: {e}")

# Rutas absolutas para evitar confusiones
BASE_DIR = "e:/carmatchapp"
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
SRC_LOGO = os.path.join(PUBLIC_DIR, "logo.png")

jobs = [
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "logo-v9.png"), None),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "favicon-v9.png"), (32, 32)),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "icon-192-v9.png"), (192, 192)),
    (SRC_LOGO, os.path.join(PUBLIC_DIR, "icon-512-v9.png"), (512, 512))
]

if __name__ == "__main__":
    print("🚀 Iniciando generación de iconos CarMatch v9...")
    for src, dest, size in jobs:
        process_logo(src, dest, dest_size=size)
    print("✨ Proceso completado.")

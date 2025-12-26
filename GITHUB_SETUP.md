# Guía Rápida: Subir CarMatch a GitHub

## Opción 1: GitHub Desktop (MÁS FÁCIL) ⭐ RECOMENDADO

1. **Descargar GitHub Desktop**
   - Ve a: https://desktop.github.com/
   - Descarga e instala

2. **Iniciar Sesión**
   - Abre GitHub Desktop
   - Haz login con tu cuenta de GitHub

3. **Agregar tu Proyecto**
   - Click en "File" > "Add local repository"
   - O "Add" > "Add existing repository"
   - Selecciona la carpeta: `e:\carmatch`
   - Click en "Add Repository"

4. **Publicar a GitHub**
   - En la esquina superior, verás un botón "Publish repository"
   - Click en "Publish repository"
   - Nombre: `carmatch`
   - Puedes dejarlo público o privado (tu eliges)
   - Click en "Publish repository"

**¡LISTO!** El código ya está en GitHub.

---

## Opción 2: Terminal (PowerShell)

Abre PowerShell y ejecuta estos comandos UNO POR UNO:

```powershell
# Ir a la carpeta del proyecto
cd e:\carmatch

# Inicializar git
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Primer deploy de CarMatch"
```

Luego:
1. Abre tu navegador
2. Ve a: https://github.com/new
3. Nombre del repositorio: `carmatch`
4. Deja todo por defecto (NO agregues README, .gitignore, etc.)
5. Click en "Create repository"

Después de crear el repo, ejecuta (cambia `TU-USUARIO` por tu usuario de GitHub):

```powershell
git remote add origin https://github.com/TU-USUARIO/carmatch.git
git branch -M main
git push -u origin main
```

Te pedirá tus credenciales de GitHub. Usa tu nombre de usuario y tu Personal Access Token (no tu password).

**¡LISTO!** El código ya está en GitHub.

---

## ¿Qué Sigue Después?

Una vez que el código esté en GitHub, continúa con:
1. Conectar GitHub a Vercel (2 minutos)
2. Configurar variables de entorno (5 minutos)
3. Deploy (automático)
4. ¡Probar en tu móvil! 🚀

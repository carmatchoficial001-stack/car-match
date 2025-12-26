const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
console.log(`Leyendo: ${schemaPath}`);

try {
    let content = fs.readFileSync(schemaPath, 'utf8');

    // 1. Eliminar BOM (Byte Order Mark) del inicio
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
        console.log('BOM detectado y eliminado.');
    }

    // 2. Normalizar saltos de línea
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const lines = content.split('\n');
    const cleanLines = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // 3. Eliminar caracteres invisibles o de control raros de cada línea
        // Mantenemos ASCII imprimible, acentos (Latin-1/UTF8) y espacios normales
        // Eliminamos todo lo que no sea eso.
        // Pero cuidado con emojis u otros caracteres válidos en comentarios.
        
        // Estrategia simple: Si la línea parece ser basura (espacios entrelazados tipo "t y p e"), la saltamos si no es válida.
        // Prisma lines usually start with a keyword or are empty or comments.
        
        const trimmed = line.trim();
        
        // Detectar líneas corruptas tipo "t y p e" (muchos espacios entre letras)
        // Si tiene más de 3 espacios consecutivos entre letras simples, es sospechoso, pero mejor filtrar por caracteres inválidos.
        
        // Vamos a reescribir la línea quitando caracteres nulos o raros
        // line = line.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');

        // Validación específica para el error "This line is invalid"
        // Si la línea tiene contenido pero no empieza con keyword conocido y no es comentario, warning.
        
        cleanLines.push(line);
    }
    
    // Filtrado específico para la basura que vimos "t y p e"
    // Esas líneas suelen tener caracteres nulos intercalados.
    
    const finalContent = cleanLines.join('\n'); // Node usará \n, que es válido.
    
    fs.writeFileSync(schemaPath, finalContent, { encoding: 'utf8' });
    console.log('Schema reescrito correctamente.');

} catch (err) {
    console.error('Error procesando schema:', err);
}

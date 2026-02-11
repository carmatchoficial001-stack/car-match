const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '../src');
const HEADER_TEXT = `// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

`;

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

function protectFiles() {
    console.log(`🛡️ Iniciando blindaje masivo en: ${TARGET_DIR}`);
    let modifiedCount = 0;
    let skippedCount = 0;

    walkDir(TARGET_DIR, (filePath) => {
        if (!filePath.match(/\.(ts|tsx|js|jsx)$/)) return;

        const content = fs.readFileSync(filePath, 'utf8');

        // Check if already protected (either by this script or manually)
        if (content.includes('CRITICAL WARNING') || content.includes('PROHIBIDO MODIFICAR') || content.includes('DO NOT MODIFY')) {
            skippedCount++;
            return;
        }

        // Handle 'use client' or 'use server' directives
        // They must be the first statement, but comments are allowed before them.
        // We will simple prepend.

        const newContent = HEADER_TEXT + content;
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`🔒 Blindado: ${path.relative(TARGET_DIR, filePath)}`);
        modifiedCount++;
    });

    console.log(`\n✅ Proceso completado.`);
    console.log(`🔒 Archivos blindados ahora: ${modifiedCount}`);
    console.log(`⏭️ Archivos ya protegidos (saltados): ${skippedCount}`);
}

protectFiles();

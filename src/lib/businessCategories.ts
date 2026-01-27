// 🏢 Centralized Business Categories & Taxonomy
// Single Source of Truth for CarMatch Business Logic
// Updated: Cleanup central_autobus

export const CATEGORY_COLORS: Record<string, string> = {
    'mecanico': '#ef4444', // Red
    'frenos': '#991b1b', // Dark Red
    'electrico': '#facc15', // Yellow
    'hojalateria': '#a855f7', // Purple
    'llantera': '#f97316', // Orange
    'polarizado': '#0f172a', // Dark Navy
    'estetica': '#3b82f6', // Blue
    'detallado': '#6366f1', // Indigo
    'refacciones': '#22c55e', // Green
    'audio': '#d97706', // Amber
    'cristales': '#06b6d4', // Cyan
    'tapiceria': '#92400e', // Brown
    'transmisiones': '#6b7280', // Cool Gray
    'gruas': '#e11d48', // Rose
    'motos': '#171717', // Black
    'performance': '#ec4899', // Pink
    'mofles': '#78716c', // Stone
    'radiadores': '#0ea5e9', // Sky Blue
    'rectificadora': '#525252', // Neutral Dark
    'blindaje': '#334155', // Slate
    'diesel': '#854d0e', // Bronze
    'offroad': '#4d7c0f', // Olive
    'cerrajeria': '#eab308', // Gold
    'gasolinera': '#ea580c', // Red-Orange
    'yonke': '#713f12', // Rust
    'estacionamiento': '#475569', // BlueGray
    'suspension': '#65a30d', // Lime
    'aire_acondicionado': '#14b8a6', // Teal
    'importadoras': '#1e3a8a', // Navy Blue
    'iluminacion': '#fde047', // Yellow-Sun
    'rotulacion': '#c026d3', // Fuchsia (Distinct from Performance)
    'inyectores': '#0891b2', // Cyan Dark (Distinct from Radiadores)
    'electrolinera': '#84cc16', // Lime Green
    'caseta': '#c2410c', // Dark Orange (Unique)
    'hospital': '#be123c', // Rose Dark (Unique)
    'policia': '#1e3a8a', // Navy Dark (Unique)
    'aeropuerto': '#0284c7', // Deep Sky (Unique)
    'estacion_tren': '#7c3aed', // Violet (Unique)

}

export const CATEGORY_EMOJIS: Record<string, string> = {
    'mecanico': '🔧',
    'frenos': '🛑',
    'electrico': '⚡',
    'hojalateria': '🎨',
    'llantera': '🛞',
    'polarizado': '🕶️',
    'estetica': '🚿',
    'detallado': '✨',
    'refacciones': '📦',
    'audio': '🔊',
    'cristales': '💎',
    'tapiceria': '💺',
    'transmisiones': '🕹️',
    'gruas': '🆘',
    'motos': '🏍️',
    'performance': '🏎️',
    'mofles': '💨',
    'radiadores': '🌡️',
    'rectificadora': '⚙️',
    'blindaje': '🛡️',
    'diesel': '⛽',
    'offroad': '⛰️',
    'cerrajeria': '🔑',
    'gasolinera': '⛽',
    'yonke': '♻️',
    'estacionamiento': '🅿️',
    'suspension': '🔩',
    'aire_acondicionado': '❄️',
    'importadoras': '🚢',
    'iluminacion': '💡',
    'rotulacion': '🖌️',
    'inyectores': '🧪',
    'electrolinera': '🔌',
    'caseta': '🛂',
    'hospital': '🏥',
    'policia': '🚓',
    'aeropuerto': '✈️',

    'estacion_tren': '🚆',
}

export const SERVICES_BY_CATEGORY: Record<string, string[]> = {
    mecanico: ['Afinación', 'Frenos', 'Suspensión', 'Motor', 'Transmisión', 'Cambio de Aceite', 'Diagnóstico por Computadora', 'Clutch', 'Ruidos', 'Diagnóstico de Fallas', 'Reparación General'],
    electrico: ['Baterías', 'Alternadores', 'Marchas', 'Luces', 'Alarmas', 'Sensores', 'Aire Acondicionado', 'Computadoras', 'Fusibles'],
    hojalateria: ['Hojalatería', 'Pintura', 'Pintura General', 'Pintura de Piezas', 'Pulido', 'Restauración de Choques', 'Enderezado de Chasis', 'Soldadura', 'Pintura Automotriz', 'Igualado de Color', 'Repintado', 'Sopleteo'],
    llantera: ['Venta de Llantas', 'Reparación de Ponchaduras', 'Alineación', 'Balanceo', 'Suspensión', 'Frenos', 'Inflado con Nitrógeno'],
    estetica: ['Lavado Exterior', 'Lavado de Interiores', 'Pulido y Encerado', 'Detallado de Motor', 'Restauración de Faros', 'Lavado de Chassis', 'Cerámico', 'Car Wash', 'Autolavado', 'Limpieza de Asientos', 'Aspirado', 'Lavado a Presión'],
    refacciones: ['Partes de Motor', 'Suspensión', 'Frenos', 'Eléctrico', 'Carrocería', 'Accesorios', 'Baterías', 'Aceites y Fluidos'],
    audio: ['Instalación de Estéreo', 'Bocinas', 'Amplificadores', 'Alarmas', 'GPS', 'Cámaras de Reversa', 'Sensores de Reversa'],
    cristales: ['Parabrisas', 'Reemplazo de Cristales', 'Reparación de Impactos', 'Espejos', 'Elevadores de Vidrios'],
    polarizado: ['Polarizado de Humo', 'Película de Seguridad', 'Nano Cerámico', 'Polarizado Inteligente', 'Desinstalación de Polarizado'],
    tapiceria: ['Tapicería de Asientos', 'Techo', 'Volante', 'Alfombras', 'Tablero', 'Fundas a Medida'],
    transmisiones: ['Transmisiones Automáticas', 'Transmisiones Manuales', 'Dirección Hidráulica', 'Diferenciales', 'Juntas Homocinéticas'],
    gruas: ['Grúa de Plataforma', 'Grúa de Arrastre', 'Paso de Corriente', 'Cambio de Llanta', 'Abasto de Combustible'],
    motos: ['Servicio General Moto', 'Llantas Moto', 'Afinación Moto', 'Frenos Moto', 'Cadena y Transmisión'],
    performance: ['Reprogramación (Tuning)', 'Escapes Deportivos', 'Filtros de Alto Flujo', 'Turbos', 'Suspensión Deportiva'],
    mofles: ['Instalación de Mofles', 'Catalizadores', 'Soldadura de Escapes', 'Colillas', 'Resonadores'],
    radiadores: ['Sondeo de Radiador', 'Soldadura de Radiador', 'Cambio de Tapas', 'Anticongelante', 'Bombas de Agua'],
    rectificadora: ['Rectificado de Cabezas', 'Cigüeñales', 'Monoblock', 'Anillada', 'Ajuste de Motor'],
    blindaje: ['Blindaje Nivel 3', 'Blindaje Nivel 5', 'Mantenimiento de Vidrios Blindados', 'Runflats'],
    diesel: ['Bombas de Inyección', 'Inyectores Diesel', 'Turbos Diesel', 'Filtros de Partículas'],
    offroad: ['Suspensión 4x4', 'Snorkel', 'Winches', 'Barras LED', 'Llantas Todo Terreno'],
    cerrajeria: ['Duplicado de Llaves', 'Programación de Llaves', 'Apertura de Autos', 'Reparación de Chapas'],
    gasolinera: ['Gasolina', 'Magna', 'Premium', 'Diesel', 'Baños', 'Tienda de Conveniencia', 'Cargar Gas', 'Echar Gas', 'Combustible'],
    yonke: ['Venta de Partes Usadas', 'Compra de Chatarra', 'Motores Usados', 'Transmisiones Usadas'],
    estacionamiento: ['Por Hora', 'Pensión Mensual', 'Techado', 'Valet Parking', '24 Horas'],
    frenos: ['Balatas', 'Discos', 'Rectificado', 'ABS', 'Líquido de Frenos'],
    suspension: ['Amortiguadores', 'Rotulas', 'Bujes', 'Cajas de Dirección', 'Ejes'],
    aire_acondicionado: ['Carga de Gas', 'Compresores', 'Fugas', 'Mangueras', 'Filtros de Cabina'],
    detallado: ['Pulido', 'Encerado', 'Lavado de Motor', 'Limpieza de Vestiduras', 'Restauración de Faros'],
    importadoras: ['Importación de Vehículos', 'Trámites de Aduana', 'Regularización', 'Venta de Autos Importados', 'Logística de Transporte'],
    iluminacion: ['Faros LED', 'Luces de Xenón', 'Iluminación Interior RGB', 'Barra de Luces 4x4', 'Reparación de Calaveras'],
    rotulacion: ['Vinyl Wrap Completo', 'Rotulación Comercial', 'Protección de Pintura (PPF)', 'Franjas Deportivas', 'Remoción de Vinil'],
    inyectores: ['Limpieza de Inyectores por Ultrasonido', 'Prueba en Banco', 'Cambio de Microfiltros', 'Diagnóstico de Inyección', 'Limpieza de Cuerpo de Aceleración'],
    electrolinera: ['Cargador Universal', 'Tesla Supercharger', 'Carga Rápida DC', 'Conector J1772', 'Conector CCS', 'Carga Nivel 2'],
    caseta: ['Pago en Efectivo', 'Tag/IAVE', 'Telepeaje', 'Sanitarios', 'Facturación'],
    hospital: ['Urgencias', 'Consulta General', 'Farmacia', 'Ambulancia', 'Laboratorio'],
    policia: ['Denuncias', 'Tránsito', 'Emergencias', 'Patrullas', 'Asistencia Vial'],
    aeropuerto: ['Vuelos Nacionales', 'Vuelos Internacionales', 'Taxis', 'Renta de Autos', 'Cambio de Divisa'],
    estacion_tren: ['Venta de Boletos', 'Andenes', 'Sala de Espera', 'Cafetería', 'Taxis']

}

// Helper for Map & Search
export const BUSINESS_CATEGORIES = Object.keys(CATEGORY_COLORS)
    .map(id => {
        const label = id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' ');
        const publicServices = ['caseta', 'hospital', 'policia', 'aeropuerto', 'estacion_tren'];

        return {
            id,
            label,
            color: CATEGORY_COLORS[id],
            icon: CATEGORY_EMOJIS[id] || '🔧',
            isPublic: publicServices.includes(id),
            keywords: [id, ...SERVICES_BY_CATEGORY[id]?.map(s => s.toLowerCase()) || []]
        };
    })
    .sort((a, b) => {
        // Public Services Logic: Put them at the end
        if (a.isPublic && !b.isPublic) return 1; // A (Public) goes after B (Business)
        if (!a.isPublic && b.isPublic) return -1; // B (Public) goes after A (Business)

        // If both are same type, sort alphabetically
        return a.label.localeCompare(b.label);
    });

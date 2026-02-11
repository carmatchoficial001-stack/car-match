// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

// 🏢 Centralized Business Categories & Taxonomy
// Single Source of Truth for CarMatch Business Logic
// Updated: Cleanup central_autobus

export const CATEGORY_COLORS: Record<string, string> = {
    'mecanico': '#ef4444', // Red (Vibrant)
    'frenos': '#991b1b', // Dark Red (Stable)
    'electrico': '#eab308', // Gold/Deep Yellow (Electric)
    'hojalateria': '#9333ea', // Purple (Premium)
    'llantera': '#f97316', // Orange (Industry)
    'polarizado': '#334155', // Slate/Navy (Shade)
    'estetica': '#2563eb', // Blue (Water/Clean)
    'detallado': '#6366f1', // Indigo (Detail/Luxury)
    'refacciones': '#16a34a', // Green (Product)
    'audio': '#d97706', // Amber (Sound)
    'cristales': '#06b6d4', // Cyan (Glass)
    'tapiceria': '#b45309', // Brown/Leather (Interior)
    'transmisiones': '#4b5563', // Grey (Mechanical)
    'gruas': '#dc2626', // Bright Red (Emergency)
    'motos': '#171717', // Pitch Black (Bike)
    'performance': '#db2777', // Deep Pink (Fast)
    'mofles': '#57534e', // Stone (Exhaust)
    'radiadores': '#0ea5e9', // Sky Blue (Cooling)
    'rectificadora': '#404040', // Neutral (Machining)
    'blindaje': '#1e293b', // Deep Slate (Armor)
    'diesel': '#713f12', // Rust/Bronze (Fuel)
    'offroad': '#3f6212', // Dark Olive (Forest)
    'cerrajeria': '#ca8a04', // Yellow/Gold (Key)
    'gasolinera': '#ea580c', // Dark Orange (Gas)
    'yonke': '#451a03', // Deep Rust (Scrap)
    'estacionamiento': '#64748b', // Blue Gray (Parking)
    'suspension': '#65a30d', // Lime (Action)
    'aire_acondicionado': '#2dd4bf', // Teal (Fresh)
    'importadoras': '#1e3a8a', // Midnight Blue (Global)
    'iluminacion': '#facc15', // Bright Sun (Light)
    'rotulacion': '#c026d3', // Fuchsia (Art)
    'inyectores': '#0891b2', // Deep Cyan (Lab)
    'electrolinera': '#84cc16', // Lime Green (EV)
    'caseta': '#92400e', // Mud Orange (Road)
    'hospital': '#be123c', // Crimson (Medical)
    'policia': '#172554', // Darkest Navy (Police)
    'aeropuerto': '#0369a1', // Ocean Blue (Sky)
    'estacion_tren': '#7c3aed', // Violet (Transport)
    'taller_ev': '#10b981', // Emerald (EV Tech)
    'lubricantes': '#422006', // Oil Black (Oil)
    'boutique': '#ec4899', // Pink (Style)
}

export const CATEGORY_EMOJIS: Record<string, string> = {
    'mecanico': 'Wrench',
    'frenos': 'CircleDot',
    'electrico': 'Zap',
    'hojalateria': 'Paintbrush',
    'llantera': 'Disc',
    'polarizado': 'Glasses',
    'estetica': 'Droplets',
    'detallado': 'Sparkles',
    'refacciones': 'Package',
    'audio': 'Speaker',
    'cristales': 'Square',
    'tapiceria': 'Armchair',
    'transmisiones': 'Settings2',
    'gruas': 'Truck',
    'motos': 'Bike',
    'performance': 'Gauge',
    'mofles': 'Wind',
    'radiadores': 'Thermometer',
    'rectificadora': 'Hammer',
    'blindaje': 'ShieldCheck',
    'diesel': 'Fuel',
    'offroad': 'Mountain',
    'cerrajeria': 'Key',
    'gasolinera': 'Fuel',
    'yonke': 'Recycle',
    'estacionamiento': 'SquareParking',
    'suspension': 'Activity',
    'aire_acondicionado': 'Snowflake',
    'importadoras': 'Ship',
    'iluminacion': 'Lightbulb',
    'rotulacion': 'PenTool',
    'inyectores': 'Syringe',
    'electrolinera': 'PlugZap',
    'caseta': 'Wallet',
    'hospital': 'Hospital',
    'policia': 'ShieldAlert',
    'aeropuerto': 'Plane',
    'estacion_tren': 'TrainFront',
    'taller_ev': 'Zap',
    'lubricantes': 'Droplet',
    'boutique': 'ShoppingBag',
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
    estacion_tren: ['Venta de Boletos', 'Andenes', 'Sala de Espera', 'Cafetería', 'Taxis'],
    taller_ev: ['Diagnóstico de Batería', 'Motores Eléctricos', 'Sistemas Híbridos', 'Carga de Batería', 'Mantenimiento Preventivo EV', 'Software Update'],
    lubricantes: ['Cambio de Aceite', 'Filtro de Aceite', 'Filtro de Aire', 'Filtro de Cabina', 'Engrasado de Chasis', 'Niveles de Fluidos'],
    boutique: ['Accesorios de Lujo', 'Fundas para Asientos', 'Fragancias', 'Cuidado Exterior', 'Regalos Automotrices', 'Equipamiento Interior']

}

// Helper for Map & Search
export const BUSINESS_CATEGORIES = Object.keys(CATEGORY_COLORS)
    .map(id => {
        let label = id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' ');

        // Basic fallback mapping for clearer default labels
        const fallbackLabels: Record<string, string> = {
            mecanico: 'Taller Mecánico',
            frenos: 'Taller de Frenos',
            electrico: 'Taller Eléctrico',
            hojalateria: 'Hojalatería y Pintura',
            llantera: 'Llantera / Vulcanizadora',
            estetica: 'Autolavado / Estética',
            detallado: 'Detallado Prof. / Cerámico',
            refacciones: 'Refaccionaria (Partes)',
            audio: 'Audio, Alarmas y GPS',
            cristales: 'Cristales para Autos',
            tapiceria: 'Tapicería Automotriz',
            transmisiones: 'Taller de Transmisiones',
            gruas: 'Servicio de Grúas',
            motos: 'Taller de Motos / Refacciones',
            performance: 'Modificaciones / Tuning',
            mofles: 'Taller de Mofles y Escapes',
            radiadores: 'Taller de Radiadores',
            rectificadora: 'Rectificadora de Motores',
            blindaje: 'Taller de Blindaje Automotriz',
            diesel: 'Taller Diesel (Motores)',
            offroad: 'Taller Offroad / 4x4',
            cerrajeria: 'Cerrajería Automotriz',
            yonke: 'Yonke / Partes Usadas',
            suspension: 'Taller de Suspensión',
            aire_acondicionado: 'Aire Acondicionado Automotriz',
            importadoras: 'Importación de Vehículos',
            iluminacion: 'Iluminación y Faros LED',
            inyectores: 'Inyectores / Laboratorio',
            rotulacion: 'Rotulación / Wrap / Vinil',
            electrolinera: 'Cargador Eléctrico',
            taller_ev: 'Taller Eléctrico e Híbrido',
            lubricantes: 'Cambio de Aceite y Filtros',
            boutique: 'Auto Boutique / Accesorios'
        };

        if (fallbackLabels[id]) label = fallbackLabels[id];

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

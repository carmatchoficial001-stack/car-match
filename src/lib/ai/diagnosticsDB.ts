/**
 * 📚 CARMATCH UNIVERSAL KNOWLEDGE BASE ("THE MECHANIC'S BIBLE")
 * 
 * Esta base de datos actúa como el cerebro de conocimiento experto para los agentes de IA.
 * Contiene fallas específicas por modelo, slang regional y mapeos técnicos avanzados.
 */

export const DIAGNOSTICS_DB = {
    // 🚗 FALLAS COMUNES POR MODELO (La "Lista Negra")
    COMMON_FAILURES: [
        // AMERICANOS
        { keywords: ["Ford", "Triton", "5.4"], issue: "Bujías expulsadas de la cabeza", category: "mecanico" },
        { keywords: ["Ford", "Focus", "Fiesta", "Powershift"], issue: "Transmisión automática patina o golpea", category: "transmisiones" },
        { keywords: ["Chevy", "Cruze", "Sonic", "Trax"], issue: "Fugas en enfriador de aceite / PCV", category: "mecanico" },
        { keywords: ["Chevrolet", "Silverado", "Sierra", "AFM", "DOD"], issue: "Falla de lifters/buzos (Active Fuel Management)", category: "mecanico" },
        { keywords: ["Dodge", "Ram", "Hemi", "5.7"], issue: "Hemi Tick / Buzos y árbol de levas desgastado", category: "mecanico" },
        { keywords: ["Jeep", "Wrangler", "Death Wobble"], issue: "Bamboleo de la muerte (Suspensión delantera floja)", category: "suspension" },

        // ASIATICOS
        { keywords: ["Nissan", "Sentra", "Altima", "Versa", "CVT"], issue: "Transmisión CVT zumba o no avanza (calentamiento)", category: "transmisiones" },
        { keywords: ["Toyota", "Prius", "Hibrido"], issue: "Batería híbrida degradada / Inversor", category: "electrico" },
        { keywords: ["Honda", "Civic", "Block"], issue: "Block agrietado (Generación 2006-2009 R18)", category: "mecanico" },
        { keywords: ["Kia", "Hyundai", "GDI"], issue: "Consumo excesivo de aceite / Carbonilla en válvulas", category: "mecanico" },

        // EUROPEOS
        { keywords: ["Volkswagen", "DSG", "Jetta", "GTI"], issue: "Mecatrónica de transmisión fallando", category: "transmisiones" },
        { keywords: ["BMW", "N54", "N55"], issue: "Bomba de agua eléctrica / Fugas de aceite en base de filtro", category: "mecanico" },
        { keywords: ["Mini", "Cooper", "Calentamiento"], issue: "Termostato o bomba de agua plástica fugando", category: "mecanico" },

        // COMERCIALES / PESAOS / DIESEL
        { keywords: ["Cummins", "ISX", "EGR"], issue: "Válvula EGR tapada / Enfriador EGR fugando", category: "diesel" },
        { keywords: ["International", "Navistar", "Maxxforce"], issue: "Falla de inyectores / Alta presión de aceite", category: "diesel" },
        { keywords: ["Detroit", "DD15"], issue: "Fugas en carcasa de filtros / Inyectores", category: "diesel" },
        { keywords: ["Urvan", "Hiace", "Transporter", "Humo"], issue: "Turbo desgastado / Inyectores sucios (Diesel)", category: "diesel" },
        { keywords: ["Sprinter", "Limp Mode", "No acelera"], issue: "Filtro de partículas (DPF) tapado / Sensor NOx", category: "diesel" },

        // TOYOTA
        { keywords: ["Toyota", "Tacoma", "Chasis"], issue: "Oxidación prematura del chasis (Recall)", category: "hojalateria" },
        { keywords: ["Toyota", "Camry", "Tablero"], issue: "Tablero pegajoso / derretido por sol", category: "estetica" },
        { keywords: ["Toyota", "Sienna", "Puerta"], issue: "Cable de puerta corrediza roto", category: "hojalateria" },
        { keywords: ["Toyota", "Rav4", "Golpe"], issue: "Golpeteo en la transmisión (ECU defectuosa en modelos 2001-2003)", category: "transmisiones" },

        // HONDA
        { keywords: ["Honda", "Odyssey", "Transmision"], issue: "Falla prematura de transmisión automática (2da y 3ra gen)", category: "transmisiones" },
        { keywords: ["Honda", "CRV", "Vibracion"], issue: "Vibración al acelerar (Juntas homocinéticas / Flechas)", category: "suspension" },
        { keywords: ["Honda", "Accord", "V6", "Frenos"], issue: "Discos de freno se deforman rápido", category: "frenos" },

        // MAZDA
        { keywords: ["Mazda", "CX-7", "Turbo"], issue: "Turbo humeando / Cadena de tiempo estirada", category: "mecanico" },
        { keywords: ["Mazda", "3", "TCM"], issue: "Módulo de control de transmisión (TCM) daña cambios", category: "transmisiones" },
        { keywords: ["Mazda", "6", "Tablero"], issue: "Tablero se despega o derrite", category: "estetica" },

        // CHEVROLET / GM
        { keywords: ["Chevrolet", "Aveo", "Banda"], issue: "Banda de distribución se rompe antes de tiempo (Interferencia)", category: "mecanico" },
        { keywords: ["Chevrolet", "Equinox", "Cadena"], issue: "Ruido de cadena de tiempo (Tensores fallan)", category: "mecanico" },
        { keywords: ["GMC", "Acadia", "Transmision"], issue: "Plato de ondas (Wave plate) roto en transmisión 6T70", category: "transmisiones" },

        // VW / AUDI / SEAT
        { keywords: ["Seat", "Ibiza", "Quemacocos"], issue: "Drenajes tapados (Entra agua a cabina)", category: "hojalateria" },
        { keywords: ["Audi", "TFSI", "Aceite"], issue: "Consumo excesivo de aceite (Segmentos de pistón)", category: "mecanico" },
        { keywords: ["VW", "Vento", "Seguros"], issue: "Falla en cerraduras de puertas", category: "electrico" },

        // OTROS
        { keywords: ["Peugeot", "206", "207", "Automática"], issue: "Transmisión AL4 entra en modo emergencia (Válvulas de presión)", category: "transmisiones" },
        { keywords: ["Renault", "Duster", "Bobina"], issue: "Bobinas de encendido fallan con humedad", category: "electrico" },
        { keywords: ["Jeep", "Cherokee", "Calentamiento"], issue: "Cabeza rajada (0331 Head)", category: "mecanico" },

        // 🚀 SUPERCHARGE - NUEVAS ADICIONES (50+)
        // BMW / MINI
        { keywords: ["BMW", "N20", "Cadena"], issue: "Falla en guías de cadena de tiempo (Ruido agudo)", category: "mecanico" },
        { keywords: ["BMW", "V8", "N63", "Aceite"], issue: "Consumo extremo de aceite y sellos de válvula", category: "mecanico" },
        { keywords: ["Mini", "Cooper", "CVT"], issue: "Transmisión CVT de primera generación falla prematura", category: "transmisiones" },

        // MERCEDES BENZ
        { keywords: ["Mercedes", "M272", "Balanceador"], issue: "Eje balanceador desgastado (Check Engine)", category: "mecanico" },
        { keywords: ["Mercedes", "SBC", "Frenos"], issue: "Módulo de frenos SBC llega al fin de vida útil", category: "frenos" },
        { keywords: ["Mercedes", "Airmatic", "Suspension"], issue: "Bolsas de aire de suspensión colapsadas", category: "suspension" },

        // LAND ROVER / JAGUAR
        { keywords: ["Land Rover", "Range Rover", "Suspension"], issue: "Falla en compresor de suspensión neumática", category: "suspension" },
        { keywords: ["Land Rover", "Ingenium", "Turbo"], issue: "Falla de turbo y cadena de distribución", category: "mecanico" },

        // FORD / LINCOLN
        { keywords: ["Ford", "Ecoboost", "3.5", "Cadena"], issue: "Ruido de cadena de tiempo (Faseres de levas)", category: "mecanico" },
        { keywords: ["Ford", "Ecoboost", "Refrigerante"], issue: "Intrusión de refrigerante en cilindros (Bloque)", category: "mecanico" },
        { keywords: ["Ford", "Explorer", "Direccion"], issue: "Falla en dirección asistida eléctrica (EPAS)", category: "suspension" },

        // CHRYSLER / DODGE / JEEP
        { keywords: ["Chrysler", "200", "9Vel"], issue: "Transmisión ZF 9HP golpea o busca marchas", category: "transmisiones" },
        { keywords: ["Jeep", "Grand Cherokee", "Ecodiesel"], issue: "Falla de motor por cigüeñal (Rodamientos)", category: "mecanico" },
        { keywords: ["Dodge", "Dart", "Clutch"], issue: "Pedal de clutch se queda pegado al fondo", category: "mecanico" },

        // NISSAN / INFINITI
        { keywords: ["Nissan", "Pathfinder", "Radiador"], issue: "Mezcla de anticongelante y aceite de transmisión (Strawberry Milkshake)", category: "transmisiones" },
        { keywords: ["Infiniti", "Q50", "Turbo"], issue: "Falla de turbos y silbido (VR30DDTT)", category: "mecanico" },

        // MAZDA
        { keywords: ["Mazda", "Skyactiv", "Carbon"], issue: "Acumulación de carbón en válvulas de admisión", category: "mecanico" },
        { keywords: ["Mazda", "CX-9", "Agua"], issue: "Bomba de agua interna fuga al aceite (Motor dañado)", category: "mecanico" },

        // HYUNDAI / KIA
        { keywords: ["Hyundai", "Theta II", "Motor"], issue: "Motor se desbiela (Recall masivo / Ruido de metales)", category: "mecanico" },
        { keywords: ["Kia", "Soul", "Catalizador"], issue: "Catalizador se desintegra y el motor lo aspira", category: "mofles" },

        // SUBARU
        { keywords: ["Subaru", "Head Gasket", "Empaques"], issue: "Fugas de empaque de cabeza (Motores EJ)", category: "mecanico" },
        // 🚜 MAQUINARIA PESADA / TRACTORES (Expert Level)
        { keywords: ["John Deere", "Tractor", "Hidraulico"], issue: "Falla en bomba hidráulica / Pérdida de potencia en brazos", category: "maquinaria" },
        { keywords: ["Case", "Excavadora", "Orugas"], issue: "Desgaste en mandos finales / Tensión de oruga", category: "maquinaria" },
        { keywords: ["Caterpillar", "CAT", "320", "Motor"], issue: "Falla en inyectores HEUI (Sistema de alta presión de aceite)", category: "maquinaria" },
        { keywords: ["Massey Ferguson", "Transmision"], issue: "Falla en embrague multipower / Deslizamiento", category: "maquinaria" },
        { keywords: ["New Holland", "Tractor", "Toma de fuerza"], issue: "Balero de toma de fuerza (PTO) ruidoso o trabado", category: "maquinaria" },
        { keywords: ["Bobcat", "Mini Cargador", "Brazo"], issue: "Falla en válvulas de control de levante", category: "maquinaria" },

        // 🚚 CAMIONES DE CARGA / TRACTOCAMIONES
        { keywords: ["Kenworth", "T680", "Sensores"], issue: "Falla en sensor de posición de cigüeñal / No arranca", category: "diesel" },
        { keywords: ["Freightliner", "Cascadia", "EATON"], issue: "Falla en embrague autoajustable (Clutch)", category: "transmisiones" },
        { keywords: ["Volvo", "VNL", "D13", "Inyectores"], issue: "Fuga de compresión en tazas de inyectores", category: "diesel" },
        { keywords: ["Mack", "Granite", "Falla"], issue: "Problema con el módulo de post-tratamiento de escape", category: "diesel" },

        // 🏁 ESPECIAL / RZRS
        { keywords: ["Polaris", "RZR", "Banda"], issue: "Banda de CVT quemada o deshilachada", category: "especial" },
        { keywords: ["Can-Am", "Maverick", "Diferencial"], issue: "Ruido en diferencial delantero (Visco-Lok)", category: "especial" },

        "baica": "Motocicleta",
        "mueble": "Automóvil",
        "mano de chango": "Excavadora/Retroexcavadora",
        "pala": "Cargador Frontal",
        "surco": "Maquinaria Agrícola",
        "mami van": "Minivan (Odyssey, Sienna)",
        "vocho": "Volkswagen Sedán",
        "fusca": "Volkswagen Sedán",
        "tsuru": "Nissan Tsuru (Vehículo muy común)",
        "bolillo": "Nissan Tsuru blanco",
        "kilo": "Mil pesos (En contexto de precio: '80 kilos')",
        "lana": "Dinero/Precio",
        "jale": "Trabajo/Reparación",
        "tirado": "Vehículo averiado en vía pública",
        "yonkeado": "Vehículo que no sirve, para partes",
        "chocolate": "Vehículo no legalizado/americano",
        "chueco": "Vehículo ilegal/sin papeles",
        "legalizado": "Vehículo importado legalmente",
        "nacional": "Vehículo vendido originalmente en México",
        "decreto": "Regularizado por decreto gubernamental"
    },

    // 🔧 MAPEO DE SISTEMAS A CATEGORÍAS (Para el Diagnosta)
    SYSTEM_TO_CATEGORY: {
        "motor": "mecanico",
        "transmision": "transmisiones",
        "caja de cambios": "transmisiones",
        "clutch": "mecanico",
        "embrague": "mecanico",
        "frenos": "frenos",
        "balatas": "frenos",
        "discos": "frenos",
        "abs": "frenos",
        "suspension": "suspension",
        "amortiguadores": "suspension",
        "rotulas": "suspension",
        "direccion": "suspension",
        "llantas": "llantera",
        "aire": "llantera",
        "ponchadura": "llantera",
        "electrico": "electrico",
        "bateria": "electrico",
        "luces": "electrico",
        "alternador": "electrico",
        "marcha": "electrico",
        "aire acondicionado": "aire_acondicionado",
        "clima": "aire_acondicionado",
        "fugas": "mecanico",
        "aceite": "mecanico",
        "radiador": "radiadores",
        "calentamiento": "radiadores",
        "anticongelante": "radiadores",
        "escape": "mofles",
        "catalizador": "mofles",
        "mofle": "mofles",
        "carroceria": "hojalateria",
        "pintura": "hojalateria",
        "choque": "hojalateria",
        "vidrios": "cristales",
        "parabrisas": "cristales",
        "estereo": "audio",
        "bocinas": "audio",
        "alarma": "audio",
        "llaves": "cerrajeria",
        "chip": "cerrajeria",
        "limpieza": "estetica",
        "lavado": "estetica",
        "gasolina": "gasolinera",
        "diesel": "gasolinera"
    }
};

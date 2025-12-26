// 🧠 CarMatch Intelligent Vehicle Taxonomy
// Single Source of Truth for Global Vehicle Data

export type VehicleCategory = 'Automóvil' | 'Motocicleta' | 'Camión' | 'Autobús' | 'Maquinaria' | 'Especial' | 'Drones'

// 📅 Dynamic Year Generator (Current + 1)
export const getYears = () => {
    const currentYear = new Date().getFullYear() + 1
    const years = []
    for (let i = currentYear; i >= 1950; i--) {
        years.push(i)
    }
    return years
}

// 🚗 Categories and Subtypes
export const VEHICLE_CATEGORIES: Record<VehicleCategory, string[]> = {
    'Automóvil': ['Sedán', 'SUV', 'Pickup', 'Deportivo', 'Convertible', 'Coupe', 'Hatchback', 'Minivan', 'Wagon', 'Crossover', 'Limusina', 'Microcar', 'Roadster'],
    'Motocicleta': ['Deportiva', 'Cruiser', 'Touring', 'Off-road', 'Scooter', 'Chopper', 'Naked', 'Dual-Sport', 'Adventure', 'Cafe Racer', 'Scrambler', 'Enduro', 'Motocross', 'Trial', 'Triciclo (Spyder/Ryker)', 'Cuatrimoto (ATV)'],
    'Camión': ['Tractocamión (Trailer)', 'Torton', 'Rabon', 'Pickup Heavy Duty', 'Volteo', 'Cisterna (Pipa)', 'Refrigerado', 'Plataforma', 'Caja Seca', 'Grúa', 'Hormigonera (Olla)', 'Portacoches (Madrina)', 'Basurero', 'Chasis Cabina'],
    'Autobús': ['Urbano', 'Interurbano', 'Turismo', 'Escolar', 'Microbús', 'Van Pasajeros', 'Articulado', 'Dos Pisos', 'Trolebús'],
    'Maquinaria': ['Excavadora', 'Retroexcavadora', 'Bulldozer', 'Montacargas', 'Tractor Agrícola', 'Cosechadora', 'Rodillo Compactador', 'Pavimentadora', 'Grúa Industrial', 'Cargador Frontal', 'Minicargador', 'Sembradora', 'Motoconformadora'],
    'Especial': ['UTV (RZR / Maverick / Side-by-Side)', 'Buggy / Arenero', 'Golf Cart', 'Go-kart', 'Motonieve', 'Ambulancia', 'Patrulla', 'Bomberos', 'Blindado', 'Food Truck', 'Casa Rodante (RV)', 'Remolque'],
    'Drones': ['Recreativo', 'Profesional', 'Agrícola', 'Industrial', 'Carreras']
}

// 🌍 Global Brands Database (Structured for Scalability)
// Note: This is a curated list of major global brands. In a real AI scenario, this would be fetched from an API.
export const BRANDS: Record<VehicleCategory, string[]> = {
    'Automóvil': [
        'Acura', 'Alfa Romeo', 'Aston Martin', 'Audi', 'BAIC', 'Bentley', 'BMW', 'Bugatti', 'Buick', 'BYD', 'Cadillac', 'Changan', 'Chery', 'Chevrolet', 'Chrysler', 'Citroën', 'Cupra', 'Dacia', 'Daewoo', 'Dodge', 'Ferrari', 'Fiat', 'Ford', 'GAC', 'Geely', 'Genesis', 'GMC', 'Great Wall', 'Haval', 'Honda', 'Hummer', 'Hyundai', 'Infiniti', 'Isuzu', 'JAC', 'Jaguar', 'Jeep', 'Jetour', 'Kia', 'Koenigsegg', 'Lamborghini', 'Land Rover', 'Lexus', 'Lincoln', 'Lotus', 'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz', 'MG', 'Mini', 'Mitsubishi', 'Nissan', 'Omoda', 'Opel', 'Pagani', 'Peugeot', 'Porsche', 'RAM', 'Renault', 'Rolls-Royce', 'Saab', 'SEAT', 'Smart', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo', 'Zeekr'
    ].sort(),
    'Motocicleta': [
        'Aprilia', 'Arctic Cat', 'Bajaj', 'Benelli', 'Beta', 'BMW Motorrad', 'BRP (Can-Am)', 'CFMoto', 'Ducati', 'GasGas', 'Harley-Davidson', 'Hero', 'Honda', 'Husqvarna', 'Indian', 'Italika', 'Kawasaki', 'KTM', 'Kymco', 'MV Agusta', 'Piaggio', 'Polaris', 'Royal Enfield', 'Segway Powersports', 'Sherco', 'Suzuki', 'Triumph', 'TVS', 'Vento', 'Vespa', 'Yamaha', 'Zontes'
    ].sort(),
    'Camión': [
        'Chevrolet', 'DAF', 'Dina', 'FAW', 'Ford Heavy', 'Foton', 'Freightliner', 'Hino', 'International', 'Isuzu', 'Iveco', 'JAC', 'Kenworth', 'Mack', 'MAN', 'Mercedes-Benz', 'Mitsubishi Fuso', 'Navistar', 'Peterbilt', 'Scania', 'Shacman', 'Sinotruk', 'Volkswagen Camiones', 'Volvo Trucks'
    ].sort(),
    'Autobús': [
        'Alexander Dennis', 'Ayco', 'Blue Bird', 'Dina', 'Irizar', 'Iveco', 'Marcopolo', 'Mercedes-Benz', 'Neoplan', 'Nova Bus', 'Scania', 'Solaris', 'Volvo', 'Yutong'
    ].sort(),
    'Maquinaria': [
        'Bobcat', 'Case', 'Caterpillar', 'Claas', 'Deere & Company (John Deere)', 'Doosan', 'Fendt', 'Hitachi', 'Hyundai Heavy Industries', 'JCB', 'Kobelco', 'Komatsu', 'Kubota', 'Liebherr', 'Manitou', 'Massey Ferguson', 'New Holland', 'Sany', 'Terex', 'Volvo CE', 'XCMG', 'Yanmar', 'Zoomlion'
    ].sort(),
    'Especial': [
        'Arctic Cat', 'BRP (Can-Am)', 'CFMoto', 'Club Car', 'E-Z-GO', 'Honda', 'John Deere Gator', 'Kawasaki', 'Kubota', 'Polaris', 'Segway Powersports', 'Talon', 'Textron', 'Yamaha', 'Winnebago', 'Airstream', 'Jayco', 'Forest River', 'Thor Motor Coach'
    ].sort(),
    'Drones': [
        'DJI', 'Autel Robotics', 'Parrot', 'Skydio', 'Yuneec', 'Hubsan', 'Syma', 'Holy Stone', 'BetaFPV', 'iFlight'
    ].sort()
}

// 🚘 Popular Models by Brand (Top Brands)
// This helps the "Smart Lists" feature. Users can still type manually if not found.
export const POPULAR_MODELS: Record<string, string[]> = {
    // === AUTOMÓVILES ===
    'Acura': ['ILX', 'TLX', 'Integra', 'MDX', 'RDX', 'NSX', 'ZDX'],
    'Alfa Romeo': ['Giulia', 'Stelvio', 'Tonale', '4C', 'MiTo'],
    'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'RS3', 'RS5', 'RS6', 'RS7', 'RS Q8'],
    'BMW': ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'Serie 7', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'M2', 'M3', 'M4', 'M5', 'i3', 'i4', 'iX'],
    'Buick': ['Encore', 'Envision', 'Enclave', 'LaCrosse', 'Regal'],
    'Cadillac': ['CT4', 'CT5', 'XT4', 'XT5', 'XT6', 'Escalade', 'Lyriq'],
    'Chevrolet': ['Aveo', 'Spark', 'Beat', 'Sonic', 'Cruze', 'Malibu', 'Camaro', 'Corvette', 'Trax', 'Tracker', 'Equinox', 'Blazer', 'Traverse', 'Tahoe', 'Suburban', 'Silverado', 'Cheyenne', 'Colorado', 'S10', 'Tornado', 'Cavalier', 'Onix', 'Captiva', 'Groove'],
    'Chrysler': ['300', 'Pacifica', 'Voyager'],
    'Dodge': ['Attitude', 'Neon', 'Charger', 'Challenger', 'Durango', 'Journey', 'Grand Caravan', 'RAM 1500', 'RAM 2500', 'RAM 4000', 'Dakota'],
    'Fiat': ['500', '500X', 'Tipo', 'Panda', 'Argo', 'Cronos', 'Mobi', 'Toro'],
    'Ford': ['Fiesta', 'Focus', 'Figo', 'Fusion', 'Mustang', 'EcoSport', 'Escape', 'Edge', 'Explorer', 'Expedition', 'Bronco', 'Bronco Sport', 'Ranger', 'F-150', 'Lobo', 'Maverick', 'Transit', 'Transit Courier', 'Territory'],
    'GMC': ['Sierra', 'Canyon', 'Terrain', 'Acadia', 'Yukon', 'Savana'],
    'Honda': ['Civic', 'City', 'Fit', 'Accord', 'Insight', 'CR-V', 'HR-V', 'BR-V', 'Pilot', 'Odyssey', 'Ridgeline', 'Element', 'Passport', 'CBR1000RR', 'CBR600RR', 'CBR500R', 'CBR300R', 'CBR250R', 'CRF450', 'CRF250', 'CRF1100 Africa Twin', 'Gold Wing', 'Rebel', 'Shadow', 'Grom', 'Navi', 'Dio', 'Elite', 'PCX', 'Varios', 'Cargo', 'Invicta', 'CB190R', 'CB500X', 'NC750X'],
    'Hyundai': ['Grand i10', 'Accent', 'Elantra', 'Sonata', 'Creta', 'Tucson', 'Santa Fe', 'Palisade', 'Venue', 'Staria', 'H100', 'Ioniq'],
    'Infiniti': ['Q50', 'Q60', 'QX50', 'QX55', 'QX60', 'QX80'],
    'Jeep': ['Wrangler', 'Rubicon', 'Sahara', 'Gladiator', 'Cherokee', 'Grand Cherokee', 'Compass', 'Renegade', 'Patriot', 'Commander', 'Wagoneer'],
    'Kia': ['Rio', 'Forte', 'K3', 'Optima', 'Stinger', 'Soul', 'Seltos', 'Sportage', 'Sorento', 'Telluride', 'Niro', 'Sedona', 'Carnival'],
    'Lexus': ['IS', 'ES', 'GS', 'LS', 'RC', 'LC', 'UX', 'NX', 'RX', 'GX', 'LX', 'RZ'],
    'Lincoln': ['Corsair', 'Nautilus', 'Aviator', 'Navigator'],
    'Mazda': ['Mazda 2', 'Mazda 3', 'Mazda 6', 'MX-5', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-9', 'CX-90', 'BT-50'],
    'Mercedes-Benz': ['Clase A', 'Clase C', 'Clase E', 'Clase S', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'Clase G', 'EQA', 'EQC', 'EQS', 'Sprinter'],
    'Mitsubishi': ['Mirage', 'Attrage', 'Lancer', 'Eclipse Cross', 'Outlander', 'Montero', 'Pajero', 'L200'],
    'Nissan': ['Versa', 'Sentra', 'March', 'Tiida', 'Tsuru', 'Altima', 'Maxima', 'Kicks', 'X-Trail', 'Pathfinder', 'Murano', 'Armada', 'Frontier', 'NP300', 'Titan', 'Urvan', 'Leaf', 'V-Drive', '370Z', 'GT-R'],
    'Porsche': ['911', 'Taycan', 'Panamera', 'Cayenne', 'Macan', 'Boxster', 'Cayman'],
    'RAM': ['1500', '2500', '3500', '4000', 'ProMaster'],
    'Renault': ['Kwid', 'Sandero', 'Logan', 'Stepway', 'Duster', 'Oroch', 'Koleos', 'Captur'],
    'Subaru': ['Impreza', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'Ascent', 'WRX', 'BRZ'],
    'Suzuki': ['Swift', 'Baleno', 'Ignis', 'Vitara', 'S-Cross', 'Ertiga', 'Ciaz', 'Jimny', 'GSX-R600', 'GSX-R750', 'GSX-R1000', 'GSX-S750', 'GSX-S1000', 'V-Strom 650', 'V-Strom 1050', 'Hayabusa', 'Boulevard', 'DR650'],
    'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster'],
    'Toyota': ['Corolla', 'Camry', 'Prius', 'Yaris', 'Supra', 'RAV4', 'Highlander', 'Sienna', 'Tacoma', 'Tundra', 'Hilux', 'Avanza', 'C-HR', 'Corolla Cross', 'Sequoia', 'Land Cruiser', '4Runner', 'Hiace'],
    'Volkswagen': ['Jetta', 'Golf', 'Polo', 'Vento', 'Virtus', 'Passat', 'Arteon', 'Beetle', 'Tiguan', 'Taos', 'T-Cross', 'Nivus', 'Teramont', 'Touareg', 'Saveiro', 'Amarok', 'Crafter', 'Transporter', 'Caddy', 'ID.4', 'Gol', 'CrossFox'],
    'Volvo': ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C40'],

    // === MOTOCICLETAS ===
    'Yamaha': ['R1', 'R6', 'R3', 'R15', 'MT-03', 'MT-07', 'MT-09', 'MT-10', 'FZ-07', 'FZ-09', 'Fazer', 'XMAX', 'NMAX', 'Ray ZR', 'Crypton', 'V-Star', 'Bolt', 'Super Tenere', 'Tenere 700', 'YZF', 'WR250', 'WR450'],

    'Kawasaki': ['Ninja 400', 'Ninja 650', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Z400', 'Z650', 'Z900', 'Versys 650', 'Versys 1000', 'Vulcan', 'KLR650', 'KX450'],

    'Ducati': ['Panigale V2', 'Panigale V4', 'Monster', 'Streetfighter', 'Multistrada', 'Diavel', 'Scrambler', 'Hypermotard'],
    'KTM': ['Duke 200', 'Duke 390', 'Duke 790', 'RC 390', 'Adventure 390', 'Adventure 1290', '450 SX-F', '250 SX'],
    'Harley-Davidson': ['Street 750', 'Iron 883', 'Sportster', 'Softail', 'Road King', 'Street Glide', 'Road Glide', 'Fat Boy', 'Pan America'],
    'BMW Motorrad': ['G 310 R', 'F 900 R', 'S 1000 RR', 'R 1250 GS', 'R 1250 RT', 'K 1600'],
    'Triumph': ['Street Triple', 'Speed Triple', 'Bonneville', 'Scrambler', 'Tiger', 'Rocket 3'],
    'Italika': ['FT150', 'FT125', 'DT150', 'DM200', 'DM250', 'WS150', 'DS150', 'Vort-X 200', 'Vort-X 300', 'Vort-X 650', 'Blackbird']
}

// ⚙️ Technical Specs Options
export const TRANSMISSIONS = ['Manual', 'Automática', 'CVT', 'Dual Clutch (DCT)', 'Tiptronic', 'Secuencial', 'Semi-automática']
export const FUELS = ['Gasolina', 'Diésel', 'Híbrido (HEV)', 'Híbrido Enchufable (PHEV)', 'Eléctrico (BEV)', 'Gas LP', 'Gas Natural (GNC)', 'Hidrógeno (FCEV)', 'Etanol']
export const TRACTIONS = ['Delantera (FWD)', 'Trasera (RWD)', '4x4 (4WD)', 'Integral (AWD)', '6x4', '6x6', '8x4', '8x8']
export const COLORS = ['Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Café', 'Beige', 'Oro', 'Bronce', 'Morado', 'Rosa', 'Bicolor', 'Mate', 'Otro']
export const CONDITIONS = ['Nuevo', 'Seminuevo (Casi Nuevo)', 'Usado', 'Para Restaurar', 'Para Piezas']

// 🧠 Helper to get features by category
export const getFeaturesByCategory = (category: VehicleCategory) => {
    const common = ['Alarma', 'GPS', 'Luces LED', 'Frenos ABS', 'Bluetooth', 'USB', 'Pantalla Touch']

    switch (category) {
        case 'Automóvil':
            return [
                ...common,
                // Confort
                'Aire Acondicionado', 'Climatizador Automático', 'Asientos de Piel', 'Asientos Eléctricos',
                'Asientos Calefactables', 'Asientos Ventilados', 'Quemacocos', 'Techo Panorámico',
                'Vidrios Eléctricos', 'Espejos Eléctricos', 'Volante Multifuncional', 'Cajuela Eléctrica',
                // Tech
                'Android Auto/CarPlay', 'Cargador Inalámbrico', 'Head-Up Display', 'Sistema de Sonido Premium',
                'Tablero Digital', 'Llave Inteligente (Keyless)', 'Cámara de Reversa', 'Cámara 360°',
                // Seguridad / ADAS
                'Bolsas de Aire (Airbags)', 'Sensores de Estacionamiento', 'Monitor de Punto Ciego',
                'Alerta de Cambio de Carril', 'Frenado Autónomo de Emergencia', 'Control Crucero Adaptativo',
                // Exterior
                'Rines de Aluminio', 'Faros de Niebla', 'Barras de Techo', 'Kit Deportivo'
            ]
        case 'Motocicleta':
            return [
                ...common,
                'Frenos de Disco', 'ABS en Curva', 'Control de Tracción', 'Quickshifter',
                'Modos de Manejo', 'Suspensión Electrónica', 'Amortiguador de Dirección',
                'Maletas Laterales', 'Top Case', 'Parabrisas', 'Defensas/Sliders',
                'Puños Calefactables', 'Asiento Comfort', 'Luces Auxiliares (Exploradoras)'
            ]
        case 'Camión':
            return [
                ...common,
                'Freno de Motor', 'Retardador', 'Camarote', 'Ejes Retráctiles', 'Suspensión de Aire',
                'Toma de Fuerza (PTO)', 'Deflector de Aire', 'Tanque Auxiliar', 'Rines de Aluminio',
                'Visera Exterior', 'Asiento Neumático', 'Eje Elevable'
            ]
        case 'Maquinaria':
            return [
                ...common,
                'Cabina Cerrada (ROPS/FOPS)', 'Aire Acondicionado', 'Calefacción', 'Joystick Control',
                'Estabilizadores', 'Cucharon 4en1', 'Línea Hidráulica Auxiliar', 'Ripper (Desgarrador)',
                'Zapatas Anchas', 'Llantas Sólidas'
            ]
        case 'Especial':
            return [
                ...common,
                'Winch (Cabrestante)', 'Roll Cage (Jaula)', 'Snorkel', 'Suspensión Lift Kit',
                'Llantas All-Terrain/Mud-Terrain', 'Luces LED Bar', 'Techo Rígido', 'Medios Puertas'
            ]
        default:
            return common
    }
}
// 💰 Global Currency Support
export const CURRENCIES = [
    { code: 'AED', name: 'Dirham (EAU)' },
    { code: 'AFN', name: 'Afgani' },
    { code: 'ALL', name: 'Lek' },
    { code: 'AMD', name: 'Dram' },
    { code: 'ANG', name: 'Florín (Antillas)' },
    { code: 'AOA', name: 'Kwanza' },
    { code: 'ARS', name: 'Peso (AR)' },
    { code: 'AUD', name: 'Dólar (AU)' },
    { code: 'AWG', name: 'Florín (Aruba)' },
    { code: 'AZN', name: 'Manat' },
    { code: 'BAM', name: 'Marco' },
    { code: 'BBD', name: 'Dólar (BB)' },
    { code: 'BDT', name: 'Taka' },
    { code: 'BGN', name: 'Lev' },
    { code: 'BHD', name: 'Dinar (BH)' },
    { code: 'BIF', name: 'Franco (BI)' },
    { code: 'BMD', name: 'Dólar (BM)' },
    { code: 'BND', name: 'Dólar (BN)' },
    { code: 'BOB', name: 'Boliviano' },
    { code: 'BRL', name: 'Real' },
    { code: 'BSD', name: 'Dólar (BS)' },
    { code: 'BTN', name: 'Ngultrum' },
    { code: 'BWP', name: 'Pula' },
    { code: 'BYN', name: 'Rublo (BY)' },
    { code: 'BZD', name: 'Dólar (BZ)' },
    { code: 'CAD', name: 'Dólar (CA)' },
    { code: 'CDF', name: 'Franco (CD)' },
    { code: 'CHF', name: 'Franco (CH)' },
    { code: 'CLP', name: 'Peso (CL)' },
    { code: 'CNY', name: 'Yuan' },
    { code: 'COP', name: 'Peso (CO)' },
    { code: 'CRC', name: 'Colón' },
    { code: 'CUP', name: 'Peso (CU)' },
    { code: 'CVE', name: 'Escudo' },
    { code: 'CZK', name: 'Corona (CZ)' },
    { code: 'DJF', name: 'Franco (DJ)' },
    { code: 'DKK', name: 'Corona (DK)' },
    { code: 'DOP', name: 'Peso (DO)' },
    { code: 'DZD', name: 'Dinar (DZ)' },
    { code: 'EGP', name: 'Libra (EG)' },
    { code: 'ERN', name: 'Nakfa' },
    { code: 'ETB', name: 'Birr' },
    { code: 'EUR', name: 'Euro' },
    { code: 'FJD', name: 'Dólar (FJ)' },
    { code: 'FKP', name: 'Libra (FK)' },
    { code: 'GBP', name: 'Libra (GB)' },
    { code: 'GEL', name: 'Lari' },
    { code: 'GHS', name: 'Cedi' },
    { code: 'GIP', name: 'Libra (GI)' },
    { code: 'GMD', name: 'Dalasi' },
    { code: 'GNF', name: 'Franco (GN)' },
    { code: 'GTQ', name: 'Quetzal' },
    { code: 'GYD', name: 'Dólar (GY)' },
    { code: 'HKD', name: 'Dólar (HK)' },
    { code: 'HNL', name: 'Lempira' },
    { code: 'HRK', name: 'Kuna' },
    { code: 'HTG', name: 'Gourde' },
    { code: 'HUF', name: 'Forinto' },
    { code: 'IDR', name: 'Rupia (ID)' },
    { code: 'ILS', name: 'Shekel' },
    { code: 'INR', name: 'Rupia (IN)' },
    { code: 'IQD', name: 'Dinar (IQ)' },
    { code: 'IRR', name: 'Rial (IR)' },
    { code: 'ISK', name: 'Corona (IS)' },
    { code: 'JMD', name: 'Dólar (JM)' },
    { code: 'JOD', name: 'Dinar (JO)' },
    { code: 'JPY', name: 'Yen' },
    { code: 'KES', name: 'Chelín (KE)' },
    { code: 'KGS', name: 'Som' },
    { code: 'KHR', name: 'Riel' },
    { code: 'KMF', name: 'Franco (KM)' },
    { code: 'KPW', name: 'Won (KP)' },
    { code: 'KRW', name: 'Won (KR)' },
    { code: 'KWD', name: 'Dinar (KW)' },
    { code: 'KYD', name: 'Dólar (KY)' },
    { code: 'KZT', name: 'Tenge' },
    { code: 'LAK', name: 'Kip' },
    { code: 'LBP', name: 'Libra (LB)' },
    { code: 'LKR', name: 'Rupia (LK)' },
    { code: 'LRD', name: 'Dólar (LR)' },
    { code: 'LSL', name: 'Loti' },
    { code: 'LYD', name: 'Dinar (LY)' },
    { code: 'MAD', name: 'Dirham (MA)' },
    { code: 'MDL', name: 'Leu' },
    { code: 'MGA', name: 'Ariary' },
    { code: 'MKD', name: 'Denar' },
    { code: 'MMK', name: 'Kyat' },
    { code: 'MNT', name: 'Tugrik' },
    { code: 'MOP', name: 'Pataca' },
    { code: 'MRU', name: 'Ouguiya' },
    { code: 'MUR', name: 'Rupia (MU)' },
    { code: 'MVR', name: 'Rufiyaa' },
    { code: 'MWK', name: 'Kwacha' },
    { code: 'MXN', name: 'Peso (MX)' },
    { code: 'MYR', name: 'Ringgit' },
    { code: 'MZN', name: 'Metical' },
    { code: 'NAD', name: 'Dólar (NA)' },
    { code: 'NGN', name: 'Naira' },
    { code: 'NIO', name: 'Córdoba' },
    { code: 'NOK', name: 'Corona (NO)' },
    { code: 'NPR', name: 'Rupia (NP)' },
    { code: 'NZD', name: 'Dólar (NZ)' },
    { code: 'OMR', name: 'Rial (OM)' },
    { code: 'PAB', name: 'Balboa' },
    { code: 'PEN', name: 'Sol' },
    { code: 'PGK', name: 'Kina' },
    { code: 'PHP', name: 'Peso (PH)' },
    { code: 'PKR', name: 'Rupia (PK)' },
    { code: 'PLN', name: 'Zloty' },
    { code: 'PYG', name: 'Guaraní' },
    { code: 'QAR', name: 'Rial (QA)' },
    { code: 'RON', name: 'Leu (RO)' },
    { code: 'RSD', name: 'Dinar (RS)' },
    { code: 'RUB', name: 'Rublo' },
    { code: 'RWF', name: 'Franco (RW)' },
    { code: 'SAR', name: 'Riyal' },
    { code: 'SBD', name: 'Dólar (SB)' },
    { code: 'SCR', name: 'Rupia (SC)' },
    { code: 'SDG', name: 'Libra (SD)' },
    { code: 'SEK', name: 'Corona (SE)' },
    { code: 'SGD', name: 'Dólar (SG)' },
    { code: 'SHP', name: 'Libra (SH)' },
    { code: 'SLL', name: 'Leone' },
    { code: 'SOS', name: 'Chelín (SO)' },
    { code: 'SRD', name: 'Dólar (SR)' },
    { code: 'SSP', name: 'Libra (SS)' },
    { code: 'STN', name: 'Dobra' },
    { code: 'SVC', name: 'Colón (SV)' },
    { code: 'SYP', name: 'Libra (SY)' },
    { code: 'SZL', name: 'Lilangeni' },
    { code: 'THB', name: 'Baht' },
    { code: 'TJS', name: 'Somoni' },
    { code: 'TMT', name: 'Manat (TM)' },
    { code: 'TND', name: 'Dinar (TN)' },
    { code: 'TOP', name: 'Pa\'anga' },
    { code: 'TRY', name: 'Lira' },
    { code: 'TTD', name: 'Dólar (TT)' },
    { code: 'TWD', name: 'Dólar (TW)' },
    { code: 'TZS', name: 'Chelín (TZ)' },
    { code: 'UAH', name: 'Grivna' },
    { code: 'UGX', name: 'Chelín (UG)' },
    { code: 'USD', name: 'Dólar (US)' },
    { code: 'UYU', name: 'Peso (UY)' },
    { code: 'UZS', name: 'Som (UZ)' },
    { code: 'VES', name: 'Bolívar' },
    { code: 'VND', name: 'Dong' },
    { code: 'VUV', name: 'Vatu' },
    { code: 'WST', name: 'Tala' },
    { code: 'XAF', name: 'Franco (BEAC)' },
    { code: 'XCD', name: 'Dólar (EC)' },
    { code: 'XOF', name: 'Franco (BCEAO)' },
    { code: 'XPF', name: 'Franco (CFP)' },
    { code: 'YER', name: 'Rial (YE)' },
    { code: 'ZAR', name: 'Rand' },
    { code: 'ZMW', name: 'Kwacha (ZM)' },
    { code: 'ZWL', name: 'Dólar (ZW)' }
]

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
    'CN': 'CNY', 'JP': 'JPY', 'KR': 'KRW', 'IN': 'INR', 'RU': 'RUB', 'UA': 'UAH', 'AU': 'AUD'
}

export const COUNTRY_DISTANCE_UNIT_MAP: Record<string, 'km' | 'mi'> = {
    'US': 'mi',
    'GB': 'mi',
    'LR': 'mi',
    'MM': 'mi'
}

/**
 * 🗺️ Map CarMatch internal locales to BCP-47 tags
 */
export const getIntlLocale = (locale: string): string => {
    const maps: Record<string, string> = {
        es: 'es-MX', en: 'en-US', pt: 'pt-BR', fr: 'fr-FR', de: 'de-DE',
        it: 'it-IT', zh: 'zh-CN', ja: 'ja-JP', ru: 'ru-RU', ko: 'ko-KR',
        ar: 'ar-SA', hi: 'hi-IN', tr: 'tr-TR', nl: 'nl-NL', pl: 'pl-PL',
        sv: 'sv-SE', id: 'id-ID', th: 'th-TH', vi: 'vi-VN', ur: 'ur-PK', he: 'he-IL'
    }
    return maps[locale] || 'es-MX'
}

/**
 * 🔢 Formatea un número según el idioma (separadores de miles)
 */
export const formatNumber = (num: number, locale: string = 'es') => {
    try {
        return new Intl.NumberFormat(getIntlLocale(locale)).format(num)
    } catch (e) {
        return num.toLocaleString()
    }
}

/**
 * 💰 Formatea el precio con separadores de miles y moneda
 */
export const formatPrice = (price: number, currency: string = 'MXN', locale: string = 'es') => {
    try {
        const formatter = new Intl.NumberFormat(getIntlLocale(locale), {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        return formatter.format(price);
    } catch (e) {
        return `${currency} ${formatNumber(price, locale)}`;
    }
}

// 🧠 CarMatch Intelligent Vehicle Taxonomy
// Single Source of Truth for Global Vehicle Data

export type VehicleCategory = 'Automóvil' | 'Motocicleta' | 'Camión' | 'Autobús' | 'Maquinaria' | 'Especial'

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
    'Automóvil': ['Sedán', 'SUV', 'Pickup', 'Deportivo', 'Convertible', 'Coupe', 'Hatchback', 'Minivan', 'Wagon', 'Crossover', 'Limusina', 'Microcar', 'Roadster', 'Moke', 'Targa', 'Shooting Brake'],
    'Motocicleta': ['Deportiva', 'Cruiser', 'Touring', 'Off-road', 'Scooter', 'Chopper', 'Naked', 'Dual-Sport', 'Adventure', 'Cafe Racer', 'Scrambler', 'Enduro', 'Motocross', 'Trial', 'Triciclo (Spyder/Ryker)', 'Cuatrimoto (ATV)', 'Moped', 'Pocket Bike', 'Supermoto'],
    'Camión': ['Tractocamión (Trailer)', 'Torton', 'Rabon', 'Pickup Heavy Duty', 'Volteo', 'Cisterna (Pipa)', 'Refrigerado', 'Plataforma', 'Caja Seca', 'Grúa', 'Hormigonera (Olla)', 'Portacoches (Madrina)', 'Basurero', 'Chasis Cabina', 'Bomberos (Camión)', 'Blindado (Valores)', 'Compactador', 'Madre (Nodriza)'],
    'Autobús': ['Urbano', 'Interurbano', 'Turismo', 'Escolar', 'Microbús', 'Van Pasajeros', 'Articulado', 'Dos Pisos', 'Trolebús', 'Minibús', 'Shuttle Bus'],
    'Maquinaria': ['Excavadora', 'Retroexcavadora', 'Bulldozer', 'Montacargas', 'Tractor Agrícola', 'Cosechadora', 'Rodillo Compactador', 'Pavimentadora', 'Grúa Industrial', 'Cargador Frontal', 'Minicargador', 'Sembradora', 'Motoconformadora', 'Telehandler', 'Sideboom', 'Barredora Industrial', 'Zanjadora', 'Perforadora'],
    'Especial': ['UTV (RZR / Maverick / Side-by-Side)', 'Buggy / Arenero', 'Golf Cart', 'Go-kart', 'Motonieve', 'Ambulancia', 'Patrulla', 'Bomberos', 'Blindado', 'Food Truck', 'Casa Rodante (RV)', 'Remolque', 'Lowboy', 'Remolque Frigorífico', 'Plataforma Porta-contenedor']
}

// 🌍 Global Brands Database (Structured for Scalability)
// Note: This is a curated list of major global brands. In a real AI scenario, this would be fetched from an API.
export const BRANDS: Record<VehicleCategory, string[]> = {
    'Automóvil': [
        'Abarth', 'AC Cars', 'Acura', 'Adler', 'Aion', 'Aiways', 'Aixam', 'Alfa Romeo', 'Allard', 'Alpina', 'Alpine', 'Alvis', 'AMC', 'Apollo', 'Aptera', 'Arash', 'Ariel', 'Arra', 'Artega', 'Aston Martin', 'Auburn', 'Audi', 'Austin', 'Austin-Healey', 'Auto Union', 'Autobianchi', 'Avatr', 'Avanti', 'BAIC', 'Bentley', 'Bizzarrini', 'BMW', 'Bollinger', 'Borgward', 'Brabham', 'Bricklin', 'Bristol', 'Bugatti', 'Buick', 'BYD', 'Cadillac', 'Callaway', 'Caparo', 'Caterham', 'Changan', 'Checker', 'Chery', 'Chevrolet', 'Chrysler', 'Cisitalia', 'Citroën', 'Cizeta', 'Coda', 'Cord', 'Cupra', 'Dacia', 'Daewoo', 'DAF', 'Daihatsu', 'Dallara', 'Datsun', 'De Tomaso', 'Deepal', 'DeLorean', 'Denza', 'DeSoto', 'Dodge', 'Dongfeng', 'Donkervoort', 'Duesenberg', 'Eagle', 'Edsel', 'Exeed', 'Facel Vega', 'Faraday Future', 'Ferrari', 'Fiat', 'Fisker', 'Ford', 'Franklin', 'GAC', 'Geely', 'Genesis', 'Ghia', 'Gillet', 'Ginetta', 'GMC', 'Great Wall', 'Gumpert', 'Haval', 'Healey', 'Hennessey', 'Hillman', 'Hindustan', 'HiPhi', 'Hispano-Suiza', 'Holden', 'Honda', 'Hongqi', 'Horch', 'Hotchkiss', 'Hudson', 'Humber', 'Hummer', 'Hupmobile', 'Hyundai', 'Imperial', 'Infiniti', 'Inezzo', 'Invicta', 'Iso', 'Isotta Fraschini', 'Isuzu', 'Italdesign', 'Iveco', 'JAC', 'Jaecoo', 'Jaguar', 'Jeep', 'Jensen', 'Jetour', 'JMC', 'Kaiser', 'Karma', 'Kia', 'Koenigsegg', 'Lada', 'Lagonda', 'Lamborghini', 'Lanchester', 'Lancia', 'Land Rover', 'Leapmotor', 'Lexus', 'Lincoln', 'Lister', 'Local Motors', 'Locomobile', 'Lola', 'Lordstown', 'Lotus', 'Lucid', 'Lynk & Co', 'Mahindra', 'Marcos', 'Marmon', 'Maserati', 'Mastretta', 'Matra', 'Maybach', 'Mazda', 'McLaren', 'Mercedes-Benz', 'Mercury', 'Messerschmitt', 'MG', 'Mini', 'Mitsubishi', 'Mitsuoka', 'Monteverdi', 'Morgan', 'Morris', 'Mosler', 'Nash', 'Nio', 'Nissan', 'Noble', 'NSU', 'Oldsmobile', 'Omoda', 'Opel', 'Ora', 'Packard', 'Pagani', 'Panhard', 'Panoz', 'Panther', 'Peerless', 'Pegaso', 'Peugeot', 'Pierce-Arrow', 'Pininfarina', 'Plymouth', 'Polestar', 'Pontiac', 'Porsche', 'Proton', 'Qoros', 'Radical', 'RAM', 'Rambler', 'Reliant', 'Renault', 'Reo', 'Rimac', 'Riley', 'Rivian', 'Rolls-Royce', 'Rootes', 'Rover', 'Saab', 'Saleen', 'Saturn', 'Scion', 'SEAT', 'Shelby', 'Simca', 'Singer', 'Siata', 'Skyworth', 'Smart', 'Spyker', 'SsangYong', 'Standard', 'Steyr', 'Studebaker', 'Stutz', 'Subaru', 'Sunbeam', 'Suzuki', 'Talbot', 'Tank', 'Tata', 'Tatra', 'Tazzari', 'Tesla', 'Think', 'Toyota', 'Triumph', 'Troller', 'Tucker', 'TVR', 'Ultima', 'Vanden Plas', 'Vauxhall', 'Vector', 'Venturi', 'VinFast', 'Volkswagen', 'Volvo', 'Voyah', 'W Motors', 'Wanderer', 'Wartburg', 'Wiesmann', 'Willys', 'Wolseley', 'Wuling', 'Xpeng', 'Yugo', 'Zacua', 'Zagato', 'Zeekr', 'Zender', 'Zenvo', 'ZIL', 'Zunder'

    ].sort(),
    'Motocicleta': [
        'AJP', 'AJS', 'Aprilia', 'Arctic Cat', 'Ariel Moto', 'Bajaj', 'Bultaco', 'Bimota', 'Benelli', 'Beta', 'BMW Motorrad', 'Brammo', 'Bridgestone', 'Brough Superior', 'BRP (Can-Am) Moto', 'BSA', 'Buell', 'Cagiva', 'CCM', 'CFMoto', 'Confederate', 'CZ', 'Daelim', 'Damon', 'Derbi', 'DKW', 'Ducati', 'Energica', 'Excelsior', 'Fantic', 'GasGas', 'Garelli', 'Gilera', 'Harley-Davidson', 'Henderson', 'Hercules', 'Hero', 'Hesketh', 'Honda Moto', 'Husaberg', 'Husqvarna', 'Hyosung', 'Indian', 'Italika', 'James', 'Java', 'Junak', 'Kawasaki', 'Keeway', 'Kreidler', 'KTM', 'Kymco', 'Lambretta', 'Laverda', 'Lifan', 'Magni', 'Maico', 'Malaguti', 'Mash', 'Matchless', 'Mondial', 'Moto Guzzi', 'Moto Morini', 'MV Agusta', 'Mutt', 'MZ', 'Norton', 'NSU Moto', 'OSSA', 'Peugeot Moto', 'Piaggio', 'Polaris', 'Puch', 'QJMotor', 'Quadro', 'Rieju', 'Royal Enfield', 'Sachs', 'Sanglas', 'Segway Powersports', 'Sherco', 'Simson', 'Sunbeam Moto', 'Suzuki Moto', 'Sym', 'Terrot', 'Triumph Moto', 'TVS', 'Ural', 'Velocette', 'Vento', 'Vespa', 'Victory', 'Vincent', 'Voge', 'Voxan', 'Yamaha Moto', 'Zündapp', 'Zero', 'Zontes'
    ].sort(),
    'Camión': [
        'Astra', 'Avia', 'Beiben', 'BMC', 'CAMC', 'Chassis', 'Chevrolet Heavy', 'DAF', 'Dayun', 'Dina', 'Dongfeng Trucks', 'Eicher', 'FAW', 'Ford Heavy', 'Foton', 'Freightliner', 'GMC Heavy', 'Hino', 'Howo', 'Hyundai Truck', 'International', 'Irizar Trucks', 'Isuzu Trucks', 'Iveco', 'JAC Trucks', 'Kamaz', 'Kenworth', 'Liaz', 'Mack', 'MAZ', 'MAN', 'Mercedes-Benz Trucks', 'Mitsubishi Fuso', 'Navistar', 'Nikola', 'Oshkosh', 'Paccar', 'Peterbilt', 'Renault Trucks', 'Scania', 'Shacman', 'Sinotruk', 'SISU', 'Sterling', 'Tata Trucks', 'Tatra', 'Terberg', 'UD Trucks', 'Volkswagen Camiones', 'Volvo Trucks', 'Western Star'
    ].sort(),
    'Autobús': [
        'Alexander Dennis', 'Ankai', 'Ashok Leyland', 'Ayco', 'Blue Bird', 'Dina', 'Foton Bus', 'Golden Dragon', 'Gullig', 'Higer', 'Hino Bus', 'Irizar', 'Isbus', 'Iveco Bus', 'King Long', 'Liaz Bus', 'MAN Bus', 'Marcopolo', 'MCI', 'Mercedes-Benz Bus', 'Neoplan', 'Nova Bus', 'Optare', 'Orion', 'Prevost', 'Scania Bus', 'Solaris', 'Sunwin', 'TEMSA', 'Thomas Built', 'Van Hool', 'VDL', 'Volvo Bus', 'Wrightbus', 'Yutong', 'Zhongtong'
    ].sort(),
    'Maquinaria': [
        'Bell', 'Bobcat', 'Bomag', 'Case', 'Caterpillar', 'Claas', 'Deere & Company (John Deere)', 'Demag', 'Deutz-Fahr', 'Dieci', 'Doosan', 'Dynapac', 'Epiroc', 'Fendt', 'Gehl', 'Genie', 'Haulotte', 'Hidromek', 'Hitachi', 'Hyundai Heavy Industries', 'JCB', 'JLG', 'John Deere', 'Jungheinrich', 'Kobelco', 'Komatsu', 'Kubota', 'Landini', 'Liebherr', 'Linde', 'Liugong', 'Lonking', 'Mahindra Agriculture', 'Manitou', 'Massey Ferguson', 'McCormick', 'Metso', 'New Holland', 'Palfinger', 'Sany', 'Sandvik', 'SDLG', 'Shantui', 'Still', 'Sumitomo', 'Takeuchi', 'Terex', 'Terex Finlay', 'Valtra', 'Volvo CE', 'Wacker Neuson', 'XCMG', 'Yanmar', 'Zoomlion'
    ].sort(),
    'Especial': [
        'Adria', 'Airstream', 'Arctic Cat', 'BRP (Can-Am)', 'CFMoto', 'Club Car', 'Cushman', 'E-Z-GO', 'Forest River', 'Grand Design', 'Hisun', 'Honda Powersports', 'Hymer', 'Jayco', 'John Deere Gator', 'Kabe', 'Kawasaki Mule', 'Kubota RTV', 'Kymco UXV', 'Niesmann+Bischoff', 'Polaris RZR', 'Segway Powersports', 'Talon', 'Textron', 'Thor Motor Coach', 'Tiffin', 'Winnebago', 'Yamaha Side-by-Side'
    ].sort()
}

// 🚘 Popular Models by Brand (Top Brands)
// This helps the "Smart Lists" feature. Users can still type manually if not found.
export const POPULAR_MODELS: Record<string, string[]> = {
    // === AUTOMÓVILES ===
    'Abarth': ['500', '595', '695', 'Punto', '124 Spider', 'Pulse Abarth', 'Fastback Abarth'],
    'Acura': ['ILX', 'TLX', 'Integra', 'MDX', 'RDX', 'NSX', 'ZDX', 'Precision EV', 'CL', 'RL', 'SLX', 'RSX', 'Legend', 'Vigor', 'EL', 'TSX', 'RLX', 'CDX'],
    'AC Cars': ['Cobra', 'Ace', 'Aceca', 'Greyhound', 'Brooklands Ace', '212 S.C.', '378 GT Zagato', 'Cobra GT Roadster'],
    'Adler': ['Trumpf', 'Standard 6', 'Diplomat', 'Favorit'],
    'Aion': ['S', 'V', 'LX', 'Y', 'Hyper SSR', 'Hyper GT', 'Hyper HT'],
    'Aiways': ['U5', 'U6', 'U7 Ion'],
    'Aixam': ['City', 'Coupe', 'Crossline', 'GTO', 'e-Aixam'],
    'Alfa Romeo': ['Giulia', 'Stelvio', 'Tonale', '4C', 'MiTo', 'Giulietta', 'Brera', '159', 'GTV', '33 Stradale', 'Junior', 'SZ', 'RZ', 'Spider', '8C Competizione', 'Montreal', 'Duetto', 'Alfetta', 'Alfasud', '166', '164', '156', '147', '145', '75', '33'],
    'Allard': ['J1', 'J2', 'K1', 'K2', 'K3', 'M1', 'P1', 'P2'],
    'Alpina': ['B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'XB7', 'D3', 'D4', 'D5', 'Roadster V8'],
    'Alpine': ['A110', 'A290', 'A310', 'A610', 'A108', 'A106', 'GTA', 'Alpenglow'],
    'Alvis': ['Speed 20', 'Speed 25', 'TE 21', 'TF 21'],
    'AMC': ['Pacer', 'Gremlin', 'Javelin', 'AMX', 'Hornet', 'Eagle', 'Matador', 'Concord', 'Ambassador', 'Rambler', 'Rebel'],
    'Apollo': ['Intensa Emozione', 'Gumpert Apollo', 'Arrow', 'G2J'],
    'Aptera': ['Launch Edition', 'Solar'],
    'Arash': ['AF8', 'AF10'],
    'Ariel': ['Atom', 'Nomad', 'Hipercar'],
    'Arra': ['EW-1'],
    'Artega': ['GT', 'Scalo', 'Karo'],
    'Aston Martin': ['Vantage', 'DB11', 'DBS', 'DBX', 'Vanquish', 'Rapide', 'Valhalla', 'Valkyrie', 'DB12', 'One-77', 'Cygnet', 'DB9', 'DB7', 'DB6', 'DB5', 'DB4', 'Virage', 'Lagonda', 'Victor', 'Vulcan', 'Atom'],
    'Auburn': ['851 Speedster', '852', '125'],
    'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q6 e-tron', 'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'e-tron GT', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'RS Q3', 'RS Q8', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'SQ5', 'SQ7', 'SQ8', 'Allroad', 'Q5 Sportback', 'RS e-tron GT', 'Quattro', 'Coupe GT', 'V8 (Sedán)', '100', '80', '90', '50', 'A2', 'E-tron Sportback'],
    'Austin': ['Mini', 'Healey', 'Seven', 'Allegro', 'Metro', 'Maestro', 'Montego', 'Princess', 'Maxi', 'A30', 'A40', 'A90'],
    'Austin-Healey': ['3000', '100', 'Sprite'],
    'Auto Union': ['Type C', 'Type D', '1000'],
    'Autobianchi': ['A112', 'Bianchina', 'Stellina', 'Y10'],
    'Avatr': ['11', '12', '15'],
    'Avanti': ['II', 'Touring Sedan', 'Convertible'],
    'BAIC': ['X25', 'X35', 'X55', 'BJ20', 'BJ40', 'D20', 'M50', 'BJ60', 'BJ80', 'EU5', 'EU7', 'BJ30', 'X7', 'BJ90'],
    'Bentley': ['Continental GT', 'Flying Spur', 'Bentayga', 'Mulsanne', 'Batur', 'Bacalar', 'Azure', 'Brooklands', 'Arnage', 'Turbo R', 'Eight', 'Mark VI', 'R Type', 'S1', 'Continental Flying Spur'],
    'Bizzarrini': ['5300 GT', 'P538', 'Velasca B2'],
    'BMW': ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'Serie 6', 'Serie 7', 'Serie 8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM', 'Z4', 'M2', 'M3', 'M4', 'M5', 'M8', 'i3', 'i4', 'iX', 'i7', 'i5', 'iX1', 'iX2', 'iX3', 'Z1', 'Z3', 'Z8', 'Isetta', '2002', '3.0 CSL', 'M1', '507', 'Serie 02', 'L7'],
    'Bollinger': ['B1', 'B2', 'B4'],
    'Borgward': ['BX5', 'BX7', 'BXi7', 'Isabella (Classic)', 'Hansa'],
    'Brabham': ['BT62', 'BT63'],
    'Bricklin': ['SV-1'],
    'Bristol': ['Fighter', 'Blenheim', 'Bullet', '400', '401', '403', '411', '603'],
    'Bugatti': ['Veyron', 'Chiron', 'Divo', 'Centodieci', 'Mistral', 'Bolide', 'Tourbillon', 'EB110', 'Type 35', 'Royale', 'Type 57', 'Type 41', 'Type 55', 'Galibier'],
    'BYD': ['Dolphin', 'Yuan Plus', 'Han', 'Tang', 'Seal', 'Song Plus', 'Qin Plus', 'King', 'Shark', 'Atto 3', 'Seagull', 'Denim', 'Yangwang U8', 'Yangwang U9', 'Fangchengbao Bao 5', 'Dolphin Mini', 'e6', 'T3'],
    'Buick': ['Encore', 'Encore GX', 'Envision', 'Enclave', 'LaCrosse', 'Regal', 'Verano', 'Electra E5', 'Electra E4', 'Riviera', 'Skylark', 'Century', 'Envision Plus', 'LeSabre', 'Park Avenue', 'Roadmaster', 'Special', 'GNX', 'Grand National', 'Invicta (Classic)'],
    'Cadillac': ['CT4', 'CT5', 'CT6', 'XT4', 'XT5', 'XT6', 'Escalade', 'Escalade IQ', 'Lyriq', 'Celestiq', 'Optiq', 'Vistiq', 'ATS', 'CTS', 'SRX', 'XTS', 'Eldorado', 'DeVille', 'Fleetwood', 'Seville', 'Series 62', 'Brougham', 'Sixty Special', 'Ciel', 'Sixteen'],
    'Callaway': ['C16', 'C12', 'SledgeHammer Corvette'],
    'Caparo': ['T1'],
    'Caterham': ['Seven 170', 'Seven 360', 'Seven 420', 'Seven 620', 'Project V', 'Seven 270', 'Seven 485'],
    'Changan': ['Alsvin', 'CS35 Plus', 'CS55 Plus', 'CS75 Plus', 'CS85', 'CS95', 'Un-K', 'Unit-T', 'Hunter', 'Deepal SL03', 'Deepal S7', 'Avatr 11', 'Lumin', 'Kaicene', 'Uni-V', 'Uni-Z'],
    'Checker': ['Marathon', 'Superba', 'Taxicab'],
    'Chery': ['Tiggo 2', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8', 'Arrizo 5', 'Arrizo 8', 'Omoda 5', 'eQ1', 'Little Ant', 'QQ', 'Fullwin', 'Tiggo 9', 'Explore 06', 'Tiggo 8 Pro Max', 'Arrizo 7'],
    'Chevrolet': ['Aveo', 'Spark', 'Beat', 'Sonic', 'Cruze', 'Malibu', 'Camaro', 'Corvette', 'Trax', 'Tracker', 'Equinox', 'Blazer', 'Traverse', 'Tahoe', 'Suburban', 'Silverado', 'Cheyenne', 'Colorado', 'S10', 'Tornado', 'Cavalier', 'Onix', 'Captiva', 'Groove', 'Montana', 'Bolt EUV', 'Blazer EV', 'Equinox EV', 'Silverado EV', 'Chevy', 'LUV', 'Cresta', 'Astra (Mex)', 'Zafira (Mex)', 'Optra', 'Epica', 'HHR', 'Volt', 'SS'],
    'Chrysler': ['300', 'Pacifica', 'Voyager', 'Town & Country', 'Aspen', 'Halcyon', 'Sebring', 'Crossfire', 'PT Cruiser', 'Imperial', 'LeBaron', 'LHS', 'Concorde', 'New Yorker', '300C'],
    'Cisitalia': ['202', '202 SMM', '360'],
    'Citroën': ['C1', 'C3', 'C3 Aircross', 'C4', 'C4 X', 'C5 Aircross', 'C5 X', 'Ami', 'Berlingo', 'DS3', 'DS4', 'DS5', '2CV', 'DS', 'SM', 'CX', 'GS', 'Mehari', 'Xantia', 'Saxo', 'Xsara'],
    'Cizeta': ['V16T'],
    'Coda': ['Sedan'],
    'Cord': ['810', '812', 'Model L-29'],
    'Cupra': ['Formentor', 'Leon', 'Ateca', 'Born', 'Tavascan', 'Terramar', 'Raval', 'DarkRebel'],
    'Dacia': ['Sandero', 'Logan', 'Duster', 'Jogger', 'Spring', 'Bigster', 'Lodgy', 'Dokker', '1310'],
    'Daewoo': ['Lanos', 'Matiz', 'Nubira', 'Leganza', 'Tico', 'Kalos', 'Lacetti', 'Tosca'],
    'Daihatsu': ['Rocky', 'Terios', 'Sirion', 'Charade', 'Copen', 'Mira', 'Hijet', 'Tanto'],
    'Dallara': ['Stradale'],
    'Datsun': ['240Z', '280ZX', '510', '120Y', 'Go', 'Go+', 'redi-Go', '720 Pickup'],
    'De Tomaso': ['P72', 'Pantera', 'Mangusta', 'Guara', 'Vallelunga', 'Longchamp', 'Deauville'],
    'Deepal': ['SL03', 'S7', 'L07', 'S07'],
    'DeLorean': ['DMC-12', 'Alpha5'],
    'Denza': ['D9', 'N7', 'N8', 'Z9', 'Z9GT'],
    'DeSoto': ['Firedome', 'Fireflite', 'Adventurer', 'Custom', 'Deluxe'],
    'Dodge': ['Attitude', 'Neon', 'Charger', 'Challenger', 'Durango', 'Journey', 'Grand Caravan', 'Dart', 'Avenger', 'Hornet', 'Charger Daytona SRT', 'Viper', 'Magnum', 'Intrepid', 'Stratus', 'Ramcharger', 'Coronet', 'Super Bee', 'Stealth', 'Spirit', 'Duster (Mex)', 'Shadow', 'Omni', 'Monaco', 'Polara', 'A100', 'Dart K (Mex)', 'Magnum (Mex)'],
    'Dongfeng': ['Nano Box', 'Huge', 'Mage', 'T5 Evo', 'Friday', 'Rich 6', 'DF6', 'Shine', 'Paladin', 'Aeolus', 'Forthing'],
    'Donkervoort': ['D8 GTO', 'F22', 'S8'],
    'Duesenberg': ['Model J', 'Model SJ', 'Model A'],
    'Eagle': ['Talon', 'Vision', 'Summit', 'Premier'],
    'Edsel': ['Citation', 'Corsair', 'Pacer', 'Ranger', 'Bermuda', 'Villager'],
    'Exeed': ['TXL', 'VX', 'LX', 'RX', 'Exlantix ES'],
    'Facel Vega': ['HK500', 'Facel II', 'Facelia'],
    'Faraday Future': ['FF 91', 'FF 81'],
    'Ferrari': ['488', 'F8 Tributo', 'SF90', 'Roma', 'Portofino', '296 GTB', 'Purosangue', '812 Superfast', 'Daytona SP3', '12Cilindri', 'Enzo', 'LaFerrari', 'F40', 'F50', 'Testarossa', '250 GTO', '360 Modena', 'F430', '458 Italia', '599 GTB', '612 Scaglietti', 'California', 'FF', 'F12berlinetta', 'GTC4Lusso', 'Portofino M', '812 GTS', 'Mondial', '400i', 'Dino 246 GT', '512 BB'],
    'Fiat': ['500', '500X', 'Tipo', 'Panda', 'Argo', 'Cronos', 'Mobi', 'Toro', 'Pulse', 'Fastback', 'Titano', 'Ducato', '600', 'Topolino', '124 Spider', 'Strada', 'Fiorino', 'Uno', 'Palio', 'Punto'],
    'Fisker': ['Ocean', 'Pear', 'Ronin', 'Alaska'],
    'Ford': ['Fiesta', 'Focus', 'Figo', 'Fusion', 'Mustang', 'EcoSport', 'Escape', 'Edge', 'Explorer', 'Expedition', 'Bronco', 'Bronco Sport', 'Ranger', 'F-150', 'Lobo', 'Maverick', 'Transit', 'Transit Courier', 'Territory', 'Mach-E', 'Super Duty', 'F-250', 'F-350', 'F-450', 'Ka', 'Puma', 'Thunderbird', 'GT', 'Excursion', 'Ikon'],
    'GAC': ['Aion S', 'Aion Y', 'GS4', 'GS8', 'GN8', 'Empow'],
    'Geely': ['Coolray', 'Emgrand', 'Okavango', 'Starray', 'Geometry C', 'GX3 Pro', 'Azkarra', 'Preface', 'Monjaro', 'Tugella', 'Panda Mini', 'Galaxy L7'],
    'Genesis': ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80', 'X Convertible', 'Magma'],
    'Ghia': ['450SS', 'Dual-Ghia', 'L6.4'],
    'Gillet': ['Vertigo'],
    'Ginetta': ['G40', 'G55', 'G60', 'Akula'],
    'GMC': ['Sierra', 'Canyon', 'Terrain', 'Acadia', 'Yukon', 'Savana', 'Hummer EV', 'Envoy', 'Jimmy', 'Syclone', 'Typhoon', 'Caballero'],
    'Great Wall': ['Poer', 'Wingle 5', 'Wingle 7', 'Ora 03', 'Tank 300', 'Tank 500', 'Haval Jolion', 'Haval H6', 'Wey Coffee 01', 'Cannon'],
    'Gumpert': ['Apollo', 'Explosion', 'Nathalie'],
    'Haval': ['Jolion', 'H6', 'Dargo', 'H9', 'F7', 'M6'],
    'Hennessey': ['Venom F5', 'VelociRaptor', 'Mammoth', 'Goliath', 'Exorcist'],
    'HiPhi': ['X', 'Z', 'Y', 'A'],
    'Hillman': ['Minx', 'Hunter', 'Imp'],
    'Hindustan': ['Ambassador', 'Contessa'],
    'Hispano-Suiza': ['Carmen', 'Carmen Boulogne', 'H6B Dubonnet Xenia', 'Alphonso XIII'],
    'Holden': ['Commodore', 'Monaro', 'Torana', 'Ute', 'Caprice', 'Kingswood', 'Jackaroo', 'Barina'],
    'Honda': ['Civic', 'City', 'Fit', 'Accord', 'Insight', 'CR-V', 'HR-V', 'BR-V', 'Pilot', 'Odyssey', 'Ridgeline', 'Element', 'Passport', 'Prologue', 'S2000', 'Integra (Type R)', 'NSX (Classic)', 'Legend', 'Prelude', 'Civic Type R', 'CR-Z', 'S660', 'Beat', 'Odyssey (JDM)', 'Stepwgn', 'N-Box'],
    'Hongqi': ['E-HS9', 'H5', 'H9', 'L5', 'HS5', 'LS7', 'QM7'],
    'Horch': ['853', '830', '930'],
    'Hotchkiss': ['686', 'Gregoire'],
    'Hudson': ['Hornet', 'Commodore', 'Terraplane', 'Jet', 'Greater Eight'],
    'Humber': ['Super Snipe', 'Sceptre', 'Hawk'],
    'Hummer': ['H1', 'H2', 'H3', 'H1 Alpha', 'H3T'],
    'Hupmobile': ['Model 20', 'Skylark'],
    'Hyundai': ['Grand i10', 'Accent', 'Elantra', 'Sonata', 'Creta', 'Tucson', 'Santa Fe', 'Palisade', 'Venue', 'Staria', 'H100', 'Ioniq 5', 'Ioniq 6', 'HB20', 'Kona', 'Tucson Hybrid', 'Alcazar', 'Exter', 'Casper', 'Azera', 'Veloster', 'Genesis (Sedán)', 'Tiburón', 'Stargazer', 'Atos', 'Dynasty', 'Equus', 'Pony', 'Scoupe'],
    'Imperial': ['Crown', 'LeBaron (Luxury)', 'Southampton'],
    'Infiniti': ['Q50', 'Q60', 'QX30', 'QX50', 'QX55', 'QX60', 'QX80', 'G35', 'G37', 'FX35', 'FX50', 'I30', 'J30', 'Q45', 'QX4', 'M35', 'M45', 'QX70'],
    'Inezzo': ['EV-1'],
    'Invicta': ['S-Type', 'Black Prince'],
    'Iso': ['Isetta', 'Grifo', 'Rivolta', 'Lele'],
    'Isotta Fraschini': ['Tipo 8', 'Tipo 8A', 'Tipo 8B'],
    'Isuzu': ['D-Max', 'MU-X', 'ELF', 'Forward', 'Rodeo', 'Trooper', 'Amigo', 'VehiCROSS', 'Piazza', 'Gemini', 'Ascender', 'Axiom', 'Oasis', 'Hombre'],
    'Italdesign': ['Zerouno', 'Duerta', 'DaVinci', 'Voyager', 'Aztec', 'Nazca C2'],
    'JAC': ['J4', 'J7', 'JS2', 'JS3', 'JS4', 'JS6', 'JS8', 'T6', 'T8', 'T9', 'E Sunray', 'E10X', 'EJ7', 'E Sei4 Pro', 'Frison T6', 'Frison T8', 'Sei 2', 'Sei 3', 'Sei 4', 'Sei 7', 'S3', 'S5', 'Refine', 'Heyue'],
    'JMC': ['Vigus', 'Grand Avenue', 'Landwind'],
    'Jaguar': ['XE', 'XF', 'XJ', 'F-Type', 'E-Pace', 'F-Pace', 'I-Pace', 'S-Type', 'X-Type', 'XK', 'XKR', 'XJ220', 'E-Type', 'D-Type', 'XK120', 'Mark II', 'XJ-S', 'C-Type', 'XK140', 'XK150'],
    'Jeep': ['Wrangler', 'Rubicon', 'Sahara', 'Gladiator', 'Cherokee', 'Grand Cherokee', 'Compass', 'Renegade', 'Patriot', 'Commander', 'Wagoneer', 'Grand Wagoneer', 'Avenger', 'Liberty', 'CJ-7', 'Comanche', 'Grand Cherokee 4xe', 'Willys MB', 'J10', 'FC-150', 'Dispatcher', 'Tornado (Mex)'],
    'Jensen': ['Interceptor', 'FF', 'Healey', '541', 'CV8'],
    'Jetour': ['X70', 'X70 Plus', 'Dashing', 'T2', 'X90 Plus', 'X95', 'T-1', 'L9'],
    'Kaiser': ['Darrin', 'Henry J', 'Manhattan', 'Frazer'],
    'Karma': ['Revero', 'Gyesera', 'Kaveya', 'GS-6'],
    'Kia': ['Rio', 'Forte', 'K3', 'K5', 'Optima', 'Stinger', 'Soul', 'Seltos', 'Sportage', 'Sorento', 'Telluride', 'Niro', 'Sedona', 'Carnival', 'EV6', 'EV9', 'Sonet', 'K2', 'K4', 'Pride', 'Mohave', 'Cadenza', 'Ray', 'Venga', 'Carens', 'Shuma', 'Sephia', 'Spectra'],
    'Koenigsegg': ['Jesko', 'Gemera', 'Regera', 'Agera', 'One:1', 'CCX', 'CCR', 'CC8S', 'Quant', 'Trevita'],
    'Lada': ['Niva', 'Granta', 'Vesta', 'Largus', 'Kalina', 'Priora', 'Samara', '2101', 'Riva'],
    'Lagonda': ['Taraf', 'Rapide'],
    'Lamborghini': ['Aventador', 'Huracán', 'Urus', 'Revuelto', 'Temerario', 'Murciélago', 'Gallardo', 'Diablo', 'Countach', 'Miura', 'Sian', 'Veneno', 'Reventón', 'Centenario', 'Estoque', 'Jarama', 'Espada', 'Urraco'],
    'Lanchester': ['Ten', 'LD10', 'Roadrider'],
    'Lancia': ['Delta', 'Stratos', '037', 'Fulvia', 'Thema', 'Ypsilon', 'Thesis', 'Flavia', 'Beta', 'Gamma', 'Aurelia', 'Appia'],
    'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque', 'Freelander', 'LR2', 'LR3', 'LR4', 'Series I', 'Series II', 'Series III', '101 Forward Control'],
    'Leapmotor': ['T03', 'C11', 'C01', 'C10'],
    'Lexus': ['IS', 'ES', 'GS', 'LS', 'RC', 'LC', 'UX', 'NX', 'RX', 'GX', 'LX', 'RZ', 'LBX', 'LFA', 'SC', 'HS', 'CT', 'TX', 'LM'],
    'Lincoln': ['Corsair', 'Nautilus', 'Aviator', 'Navigator', 'MKZ', 'MKC', 'MKX', 'MKS', 'MKT', 'Town Car', 'Continental', 'Zephyr', 'Blackwood', 'Mark VII', 'Mark VIII', 'Cosmopolitan'],
    'Lister': ['Storm', 'Knobbly'],
    'Local Motors': ['Rally Fighter'],
    'Lola': ['T70', 'T163'],
    'Lordstown': ['Endurance'],
    'Lotus': ['Evija', 'Emira', 'Eletre', 'Emeya', 'Elise', 'Exige', 'Evora', 'Esprit', 'Europa', 'Elan', 'Seven', 'Cortina', 'Omega'],
    'Lucid': ['Air', 'Gravity'],
    'Lynk & Co': ['01', '02', '03', '05', '06', '08', '09'],
    'Mahindra': ['XUV700', 'Scorpio-N', 'Thar', 'Bolero', 'KUV100', 'XUV300'],
    'Marcos': ['Mantis', 'Mantis XP', 'GT'],
    'Marmon': ['Sixteen', 'Roosevelt'],
    'Maserati': ['Ghibli', 'Quattroporte', 'Levante', 'Grecale', 'MC20', 'GranTurismo', 'GranCabrio', 'Spyder', 'Bora', 'Merak', 'Khamsin', 'Indy', 'Mistral', '3500 GT', 'Sebring'],
    'Mastretta': ['MXT', 'MXR'],
    'Matra': ['Murena', 'Bagheera', 'Djet', 'Rancho', 'Espace (Original Concept)'],
    'Maybach': ['57', '62', 'Exelero', 'Zeppelin', 'S-Class Maybach', 'GLS-Class Maybach'],
    'Mazda': ['Mazda 2', 'Mazda 3', 'Mazda 6', 'MX-5', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-70', 'CX-9', 'CX-90', 'BT-50', 'MX-30', 'CX-80', 'RX-7', 'RX-8', 'B2200', 'B2600', '323', '626', '929', 'MPV', 'Tribute', 'Millenia', 'Cosmo'],
    'McLaren': ['720S', '750S', '765LT', 'Artura', 'P1', 'Senna', 'Speedtail', 'Elva', 'GT', 'GTS', 'F1', 'MP4-12C', '650S', '675LT', '570S', '540C', '600LT', 'Sabre', 'Solus GT'],
    'Mercedes-Benz': ['Clase A', 'Clase B', 'Clase C', 'Clase E', 'Clase S', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'Clase G', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'AMG GT', 'SL', 'Sprinter', 'Vito', 'Viano', 'X-Class', '190E', 'SLK', 'CLK', 'ML', 'GL', '300SL Gullwing', 'R-Class', '190SL', '280SL', 'Pagoda', 'W123', 'W124'],
    'Mercury': ['Grand Marquis', 'Cougar', 'Sable', 'Villager', 'Mountaineer', 'Marauder', 'Monterey', 'Comet', 'Cyclone', 'Capri', 'Milan', 'Mariner'],
    'Messerschmitt': ['KR200', 'KR175', 'Tiger'],
    'MG': ['MG5', 'MG ZS', 'MG HS', 'MG GT', 'MG RX5', 'MG RX8', 'MG4', 'Marvel R', 'Cyberster', 'MG3', 'MG ONE', 'MG7', 'MG Comet', 'MGB', 'Midget', 'A (Classic)', 'B (Classic)', 'TC', 'TD', 'TF'],
    'Mini': ['Cooper', 'Cooper S', 'Countryman', 'Clubman', 'Convertible', 'Aceman', 'Paceman', 'Coupe', 'Roadster', 'Classic Mini', 'Moke'],
    'Mitsubishi': ['Mirage', 'Attrage', 'Lancer', 'Eclipse Cross', 'Outlander', 'Montero Sport', 'Pajero', 'L200', 'Xpander', 'ASX', 'Eclipse', 'Galant', 'Diamante', '3000GT', 'Space Star', 'Starion', 'Cordia', 'Tredia', 'Sigma', 'Magna', 'Delica', 'Endeavor', 'Montero Limited'],
    'Mitsuoka': ['Buddy', 'Rock Star', 'Orochi', 'Viewt', 'Galue', 'Ryugi'],
    'Monteverdi': ['High Speed', 'Safari', 'Hai'],
    'Morgan': ['Plus Four', 'Plus Six', 'Super 3', '3-Wheeler', 'Roadster', 'Aero 8', 'Plus 8', '4/4'],
    'Morris': ['Minor', 'Oxford', 'Marina', 'Ital', 'Cowley'],
    'Mosler': ['MT900', 'Consulier GTP'],
    'Nash': ['Ambassador', 'Metropolitan', 'Healey', 'Rambler', 'Lafayette'],
    'Nio': ['ET5', 'ET7', 'ET9', 'ES6', 'ES8', 'EC6', 'EC7', 'EP9'],
    'Nissan': ['Versa', 'Sentra', 'March', 'Tiida', 'Tsuru', 'Altima', 'Maxima', 'Kicks', 'X-Trail', 'Pathfinder', 'Murano', 'Armada', 'Frontier', 'NP300', 'Titan', 'Urvan', 'NV350', 'Leaf', 'V-Drive', '370Z', '400Z', 'GT-R', 'Z', 'Ariya', 'Terra', 'Xterra', 'Bluebird', '240SX', 'Silvia', 'Datsun', 'Juke', 'Note', 'Qashqai', 'Patrol', 'Skyline', 'Quest', 'Pathfinder Hybrid', 'Magnite'],
    'Noble': ['M600', 'M500', 'M12', 'M15'],
    'NSU': ['Prinz', 'Ro 80', 'Wankel Spider'],
    'Oldsmobile': ['Cutlass', 'Alero', 'Achieva', 'Bravada', 'Silhouette', 'Intrigue', 'Aurora', '88', '98', '442', 'Toronado', 'Starfire'],
    'Omoda': ['C5', 'O5', 'O5 GT', 'E5'],
    'Opel': ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Grandland', 'Crossland', 'Adam', 'Karl', 'Zafira', 'Combo', 'Vivaro', 'Movano', 'Manta', 'GT (Classic)', 'Kadett'],
    'Ora': ['03', 'Lightning Cat', 'Good Cat', 'Ballet Cat'],
    'Packard': ['Twelve', 'Eight', 'Caribbean', 'Clipper', 'Patrician'],
    'Pagani': ['Zonda', 'Huayra', 'Utopia', 'Imola'],
    'Panhard': ['PL 17', '24', 'Dyna X', 'Dyna Z'],
    'Panoz': ['Esperante', 'Avezzano', 'Roadster'],
    'Panther': ['Solo', 'Kallista', 'Lima', 'Rio', 'J72'],
    'Peerless': ['GT'],
    'Pegaso': ['Z-102', 'Z-103'],
    'Peugeot': ['208', '301', '308', '408', '508', '2008', '3008', '5008', 'Partner', 'Rifter', 'Expert', 'Manager', 'Landtrek', '108', 'RCZ', '405', '406', '407', '206', '207', '106', '607', '807', '504', '404', '205 GTI'],
    'Pierce-Arrow': ['Eight', 'Twelve', 'Silver Arrow'],
    'Pininfarina': ['Battista', 'B95'],
    'Plymouth': ['Barracuda', 'Road Runner', 'Superbird', 'Prowler', 'Voyager', 'Fury', 'Belvedere', 'Reliant', 'Duster (USA)', 'Neon (Plymouth)'],
    'Polestar': ['1', '2', '3', '4', '5', '6'],
    'Pontiac': ['Firebird', 'GTO', 'Trans Am', 'Grand Am', 'Grand Prix', 'Bonneville', 'Fiero', 'Solstice', 'Aztek', 'Vibe', 'Sunfire', 'Torrent', 'G8', 'G6', 'G5', 'G3', 'Lemans', 'Catalina'],
    'Porsche': ['911', '718 Boxster', '718 Cayman', 'Taycan', 'Panamera', 'Cayenne', 'Macan', '918 Spyder', 'Carrera GT', '924', '944', '928', '959', '968', '356', '550 Spyder', '914', '912', 'Taycan Cross Turismo'],
    'Proton': ['Saga', 'X50', 'X70', 'X90', 'Persona', 'Iriz'],
    'Qoros': ['3', '5', '7'],
    'Radical': ['SR3', 'SR10', 'RXC'],
    'RAM': ['700', '1000', '1500', '2500', '3500', '4000', 'ProMaster', 'ProMaster Rapid', 'Rampage', 'TRX', 'Dakota', 'SRT-10'],
    'Rambler': ['Classic', 'American', 'Ambassador', 'Marlin'],
    'Reliant': ['Robin', 'Scimitar', 'Kitten', 'Regal'],
    'Renault': ['Kwid', 'Sandero', 'Logan', 'Stepway', 'Duster', 'Oroch', 'Koleos', 'Captur', 'Megane E-Tech', 'Kardian', 'Twizy', 'Clio', 'Megane (Combustión)', 'Fluence', 'Kangoo', 'Master', 'Alaska', 'R5', 'R4', 'Alpine (Mex)', 'Encore (Mex)', 'Alliance (Mex)', 'Twingo', 'Espace', 'Scenic', 'Laguna', 'Symbol', 'Safrane', 'Austral', 'Rafale'],
    'Reo': ['Speed Wagon', 'Flying Cloud', 'Royale'],
    'Rimac': ['Nevera', 'Concept_One', 'Concept_S'],
    'Riley': ['RM', 'Pathfinder', 'Elf', 'Kestrel'],
    'Rivian': ['R1T', 'R1S', 'R2', 'R3', 'EDV'],
    'Rolls-Royce': ['Phantom', 'Ghost', 'Wraith', 'Dawn', 'Cullinan', 'Spectre', 'Silver Shadow', 'Silver Cloud', 'Corniche', 'Camargue', 'Silver Spirit', 'Silver Seraph'],
    'Rootes': ['Group'],
    'Rover': ['200', '400', '600', '800', '75', '45', '25', 'Streetwise', 'SD1', 'P6', 'P5'],
    'Saab': ['9-3', '9-5', '900', '9000', '99', '96', '9-4X', '9-7X', 'Sonett'],
    'Saleen': ['S7', 'S1', 'S5S Raptor', 'S302 Mustang'],
    'Saturn': ['Vue', 'Ion', 'Sky', 'Aura', 'Outlook', 'SC2', 'SL2', 'L300'],
    'Scion': ['tC', 'xB', 'xA', 'xD', 'iQ', 'FR-S', 'iA', 'iM'],
    'SEAT': ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Toledo', 'Alhambra', 'Altea', 'Exeo', 'Cordoba'],
    'Shelby': ['Cobra', 'GT350', 'GT500', 'Series 1', 'Daytona Coupe', 'GLHS'],
    'Simca': ['Aronde', 'Vedette', 'Ariane', '1000', '1100', '1301', '1501', 'Horizon', '1307', 'Solara'],
    'Singer': ['Gazelle', 'Vogue', 'Chamois', 'Hunter', '911 (Restomod)'],
    'Siata': ['208CS', 'Daina', 'Spring'],
    'Skyworth': ['EV6', 'HT-i'],
    'Smart': ['Fortwo', 'Forfour', '#1', '#3', '#5', 'Roadster', 'Crossblade'],
    'Spyker': ['C8 Spyder', 'C8 Laviolette', 'C8 Aileron', 'C8 Preliator', 'C12 Zagato', 'D8 Beijing-to-Paris'],
    'SsangYong': ['Korando', 'Musso', 'Rexton', 'Tivoli', 'Kyron', 'Actyon', 'Torres', 'Chairman'],
    'Standard': ['Vanguard', 'Eight', 'Ten', 'Pennant', 'Ensign'],
    'Steyr': ['Puch G', 'Puch 500', '120', '220'],
    'Studebaker': ['Avanti', 'Lark', 'Commander', 'President', 'Champion', 'Silver Hawk', 'Golden Hawk', 'Starlight', 'Dictator'],
    'Stutz': ['Bearcat', 'Blackhawk', 'Victoria'],
    'Subaru': ['Impreza', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'Ascent', 'WRX', 'BRZ', 'Solterra', 'Baja', 'Tribeca', 'SVX'],
    'Sunbeam': ['Alpine', 'Tiger', 'Rapier', 'Stiletto', 'Lotus'],
    'Suzuki': ['Swift', 'Baleno', 'Ignis', 'Vitara', 'S-Cross', 'Ertiga', 'Ciaz', 'Jimny', 'Fronx', 'Grand Vitara', 'XL7', 'Spresso', 'Alto', 'Celerio', 'Sidekick', 'Samurai'],
    'Talbot': ['Sunbeam', 'Horizon', 'Samba', 'Tagora', 'Matra Rancho', 'Murena'],
    'Tank': ['300', '400', '500', '700', '800'],
    'Tata': ['Nano', 'Tiago', 'Nexon', 'Harrier', 'Safari', 'Punch', 'Altroz', 'Curvv', 'Indica', 'Indigo', 'Sumo', 'Sierra'],
    'Tatra': ['T87', 'T603', 'T613', 'T700', 'JK 2500', 'T815', 'Phoenix', 'TerrNo1', 'Jamal', 'T810'],
    'Tazzari': ['Zero', 'EM2 Space'],
    'Tesla': ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster', 'Semi'],
    'Think': ['City'],
    'Toyota': ['Corolla', 'Camry', 'Prius', 'Yaris', 'Supra', 'RAV4', 'Highlander', 'Sienna', 'Tacoma', 'Tundra', 'Hilux', 'Avanza', 'C-HR', 'Corolla Cross', 'Sequoia', 'Land Cruiser', '4Runner', 'Hiace', 'Raize', 'Sienna Hybrid', 'Crown', 'Grand Highlander', 'Venza', 'Celica', 'MR2', 'Paseo', 'Matrix', 'FJ Cruiser', 'Solara'],
    'Triumph': ['TR3', 'TR4', 'TR5', 'TR6', 'TR7', 'TR8', 'Spitfire', 'Stag', 'GT6', 'Herald', 'Vitesse', 'Dolomite', '2000'],
    'Troller': ['T4', 'Pantanal'],
    'Tucker': ['48 (Tucker Torpedo)'],
    'TVR': ['Griffith', 'Chimaera', 'Cerbera', 'Tuscan', 'Sagaris', 'Tamora', 'Vixen', 'Grantura', 'M Series', 'Tasmin'],
    'Ultima': ['RS', 'Evolution', 'GTR', 'Can-Am'],
    'Vanden Plas': ['Princess', '1500'],
    'Vauxhall': ['Corsa (UK)', 'Astra (UK)', 'Insignia (UK)', 'Mokka (UK)', 'Viva', 'Victor', 'Cresta', 'Wyvern', 'Velox', 'Carlton', 'Senator', 'Cavalier', 'Monaro (UK)', 'VXR8'],
    'Vector': ['W8', 'M12'],
    'Venturi': ['Atlantique', '400GT', 'Fetish'],
    'VinFast': ['VF 5', 'VF 6', 'VF 7', 'VF 8', 'VF 9', 'VF e34', 'President', 'Lux A2.0'],
    'Volkswagen': ['Jetta', 'Golf', 'Polo', 'Vento', 'Virtus', 'Passat', 'Arteon', 'Beetle', 'Tiguan', 'Taos', 'T-Cross', 'Nivus', 'Teramont', 'Touareg', 'Saveiro', 'Amarok', 'Crafter', 'Transporter', 'Caddy', 'ID.3', 'ID.4', 'ID.Buzz', 'Gol', 'CrossFox', 'Polo Track', 'Tayron', 'Bora', 'Combi', 'Sedán (Vocho)', 'Pointer', 'Derby', 'Corsar', 'Atlantic', 'Caribe', 'Scirocco', 'Corrado', 'Karmann Ghia', 'Lupo', 'Fox', 'Brasilia', 'Hormiga (Mex)', 'Safari (VW 181)', 'Taigun'],
    'Volvo': ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C40', 'EX30', 'EX90', 'V40', 'C30', 'S40', 'S80', 'XC70', '240', '740', '940', '850', 'PV544', 'Amazon', 'P1800'],
    'Voyah': ['Free', 'Dreamer', 'Passion'],
    'W Motors': ['Lykan Hypersport', 'Fenyr Supersport', 'Ghiath'],
    'Wanderer': ['W24', 'W25', 'W50'],
    'Wartburg': ['311', '312', '313', '353', '1.3'],
    'Wiesmann': ['MF3', 'MF4', 'MF5', 'Project Thunderball'],
    'Willys': ['Jeep CJ', 'Wagon', 'Pickup', 'Aero', 'Interlagos (Mex)', 'Knight'],
    'Wolseley': ['Hornet', '1500', '6/110', '18/85'],
    'Wuling': ['Hongguang Mini EV', 'Almaz', 'Cortez', 'Confero', 'Binguo'],
    'Xpeng': ['P7', 'P5', 'G9', 'G6', 'G3'],
    'Yugo': ['GV', 'Koral', 'Florida'],
    'Zacua': ['MX2', 'MX3'],
    'Zagato': ['TZ3', 'Perana Z-One', 'Mostro'],
    'Zeekr': ['001', '007', '009', 'X'],
    'Zender': ['Fact 4', 'Vision 3'],
    'Zenvo': ['ST1', 'TS1', 'TSR-S', 'Aurora'],
    'ZIL': ['4104', '111', '114', '117'],
    'Zunder': ['1500'],

    // === MOTOCICLETAS ===
    'AJP': ['PR3', 'PR4', 'PR5', 'PR7'],
    'AJS': ['Cadwell', 'Tempest', '7R', 'Porcupine'],
    'Aprilia': ['RSV4', 'Tuono V4', 'RS 660', 'Tuareg 660', 'Tuono 660', 'SR GT', 'RX 125', 'SX 125'],
    'Arctic Cat': ['Alterra', 'Prowler', 'Wildcat'],
    'Bajaj': ['Pulsar NS200', 'Pulsar N250', 'Dominar 400', 'Dominar 250', 'Avenger 220', 'Platina 125', 'CT100', 'Discover', 'Chetak', 'Pulsar RS200', 'Pulsar 150', 'V15', 'Boxer'],
    'Benelli': ['TRK 502', 'Leoncino 500', 'TNT 600', '752 S', 'Imperiale 400', '302S', 'TRK 702'],
    'Beta': ['RR 300', 'RR 350', 'Xtrainer', 'EVO'],
    'Bimota': ['Tesi H2', 'KB4', 'DB8', 'YB11'],
    'BMW Motorrad': ['G 310 R', 'G 310 GS', 'F 750 GS', 'F 850 GS', 'F 900 R', 'F 900 XR', 'S 1000 RR', 'S 1000 R', 'S 1000 XR', 'R 1250 GS', 'R 1300 GS', 'R 1250 RT', 'R 18', 'K 1600', 'CE 04', 'S 1000 RR', 'M 1000 RR', 'R nineT'],
    'Brammo': ['Empulse', 'Enertia'],
    'Bridgestone': ['350 GTR'],
    'Brough Superior': ['SS100', 'Lawrence'],
    'BRP (Can-Am) Moto': ['Spyder', 'Ryker', 'Outlander', 'Renegade', 'Maverick'],
    'BSA': ['Gold Star', 'Rocket 3', 'Bantam'],
    'Buell': ['Hammerhead', '1125R', 'XB12S'],
    'Bultaco': ['Sherpa T', 'Pursang', 'Metralla'],
    'Cagiva': ['Mito', 'Elefant', 'Raptor'],
    'CCM': ['Spitfire', 'GP450'],
    'CFMoto': ['450SR', '800MT', '700CL-X', '300NK', '650GT', '450NK', '800NK', 'Papio'],
    'Confederate': ['Hellcat', 'Fighter', 'Wraith'],
    'CZ': ['Type 860', 'Type 477'],
    'Daelim': ['Daystar', 'Roadwin'],
    'Damon': ['Hypersport', 'Hyperfighter'],
    'Derbi': ['Senda', 'GPR', 'Mulhacén'],
    'DKW': ['RT 125', 'NZ 350'],
    'Ducati': ['Monster', 'Multistrada V4', 'Panigale V4', 'Panigale V2', 'Streetfighter V4', 'Diavel V4', 'Scrambler', 'DesertX', 'Hypermotard', 'SuperSport 950', 'XDiavel'],
    'Energica': ['Ego', 'Eva Ribelle', 'Experia'],
    'Fantic': ['Caballero', 'Enduro XE', 'Motard XM'],
    'GasGas': ['EC 300', 'MC 450F', 'ES 700', 'SM 700', 'TXT Racing'],
    'Garelli': ['Ciclone', 'VIP'],
    'Gilera': ['Runner', 'GP800', 'Fuoco'],
    'Harley-Davidson': ['Sportster S', 'Nightster', 'Softail Standard', 'Street Bob', 'Fat Boy', 'Heritage Classic', 'Road King', 'Street Glide', 'Road Glide', 'Ultra Limited', 'Pan America', 'LiveWire', 'Iron 883', 'Forty-Eight', 'Street 750'],
    'Henderson': ['Streamline', 'Four'],
    'Hercules': ['W-2000', 'K-125'],
    'Hero': ['Hunk 160R', 'Hunk 150', 'XPulse 200', 'Eco Deluxe', 'Splendor', 'Ignitor', 'Dash 125', 'Xoom'],
    'Hesketh': ['V1000', '24'],
    'Honda Moto': ['CBR1000RR', 'CBR600RR', 'CBR500R', 'CB1000R', 'CB650R', 'CRF1100 Africa Twin', 'Gold Wing', 'Rebel 500', 'Rebel 1100', 'Shadow', 'Grom', 'Navi', 'Dio', 'Elite', 'PCX', 'Cargo', 'Invicta', 'XR150L', 'XR190L', 'X-ADV', 'NC750X', 'CB500X', 'VFR800', 'CB190R'],
    'Husaberg': ['FE 450', 'TE 300'],
    'Husqvarna': ['Vitpilen 401', 'Svartpilen 401', 'Norden 901', '701 Supermoto', 'TE 300', 'FE 450'],
    'Hyosung': ['Aquila GV650', 'GT250R', 'ST7'],
    'Indian': ['Chief', 'Scout', 'Chieftain', 'Roadmaster', 'Challenger', 'FTR', 'Pursuit'],
    'Italika': ['FT150', 'FT125', 'DT150', 'DM200', 'DM250', 'WS150', 'DS150', 'Vort-X 200', 'Vort-X 300', 'Vort-X 650', 'Blackbird', 'TC250', 'SPTFIRE', 'VX250', 'D125', 'Vitaliv', 'RT200', 'RT250', 'RC200', 'RC250', 'ST90'],
    'James': ['Comet', 'Captain'],
    'Java': ['350', 'Perak', '42'],
    'Junak': ['M10', 'M11'],
    'Kawasaki': ['Ninja 400', 'Ninja 650', 'Ninja ZX-6R', 'Ninja ZX-10R', 'Ninja H2', 'Z400', 'Z650', 'Z900', 'Versys 650', 'Versys 1000', 'Vulcan S', 'KLR650', 'KX450', 'Z H2', 'Ninja 500', 'Eliminator'],
    'Keeway': ['Superlight 200', 'RKF 125', 'K-Light', 'Vieste', 'TX200'],
    'Kreidler': ['Florett'],
    'KTM': ['Duke 200', 'Duke 390', 'Duke 790', 'Duke 890', 'Duke 1290 Super Duke R', 'RC 200', 'RC 390', 'Adventure 390', 'Adventure 790', 'Adventure 1290', '450 SX-F', 'Duke 250', 'RC 125', '300 EXC', '690 Enduro'],
    'Kymco': ['AK 550', 'Downtown 350', 'Agility City', 'X-Town', 'Like 150'],
    'Lambretta': ['V-Special', 'G350'],
    'Laverda': ['Jota', 'SFC'],
    'Lifan': ['KPR200', 'Lyra'],
    'MV Agusta': ['F3', 'Brutale', 'Dragster', 'Turismo Veloce', 'Superveloce'],
    'Piaggio': ['Liberty', 'Beverly', 'Medley', 'MP3'],
    'Royal Enfield': ['Classic 350', 'Meteor 350', 'Hunter 350', 'Himalayan', 'Interceptor 650', 'Continental GT 650', 'Super Meteor 640', 'Shotgun 650', 'Bullet 350', 'Scram 411'],
    'Suzuki Moto': ['GSX-R1000', 'Hayabusa', 'GSX-S750', 'GSX-S1000', 'V-Strom 650', 'V-Strom 1050', 'SV650', 'Boulevard', 'DR650', 'Gixxer 150', 'Gixxer 250', 'AX100', 'Burgman', 'Address', 'Katana', 'GSX-8S', 'V-Strom 800DE'],
    'Triumph Moto': ['Street Triple', 'Speed Triple', 'Tiger 900', 'Tiger 1200', 'Tiger Sport 660', 'Bonneville T100', 'Bonneville T120', 'Scrambler 900', 'Scrambler 1200', 'Rocket 3', 'Trident 660', 'Speed 400', 'Scrambler 400 X', 'Thruxton RS'],
    'Vento': ['Lithium 150', 'Lithium 190', 'Nitrox 250', 'Nitrox 300', 'Rocketman 250', 'Thunderstar 250', 'Hyper 280', 'Storm 250', 'Lucky 7', 'Cyclone 200', 'Screamer 250', 'Alpina 300', 'Workman', 'Ryder', 'Xpress'],
    'Vespa': ['Primavera', 'Sprint', 'GTS', 'Elettrica', 'Sei Giorni'],
    'Yamaha Moto': ['YZF-R1', 'YZF-R6', 'YZF-R3', 'YZF-R7', 'MT-03', 'MT-07', 'MT-09', 'MT-10', 'Tracer 9', 'Tenere 700', 'XMAX', 'NMAX', 'Bolt', 'Super Tenere', 'FZ-S', 'Fazer 250', 'YZ450F', 'R15', 'MT-15', 'Crypton', 'Cygnus Ray ZR'],

    // === CAMIONES / HEAVY DUTY ===
    'DAF': ['XF', 'XG', 'XD', 'LF', 'CF'],
    'Dayun': ['CGC', 'N8'],
    'Dina': ['Linner', 'Runner', 'Outsider', 'Hulk', 'Bullter', 'Liner', 'Buller'],
    'Dongfeng Trucks': ['KL', 'KX', 'KR', 'Captain'],
    'Eicher': ['Pro 2000', 'Pro 6000'],
    'FAW': ['Tiger V', 'J6P', 'J7'],
    'Ford Heavy': ['F-650', 'F-750', 'Cargo'],
    'Foton': ['Auman', 'Aumark', 'Ollin', 'M-Series', 'S-Series'],
    'Freightliner': ['Cascadia', 'M2 106', 'M2 112', '114SD', '122SD', 'Columbia', 'Century Class', 'FL70', 'FL80', 'Business Class M2'],
    'GMC Heavy': ['TopKick', 'Brigadier'],
    'Hino': ['Serie 300', 'Serie 500', 'Hybrid', 'Dutro', 'Serie 700'],
    'International': ['LT Series', 'HV Series', 'HX Series', 'MV Series', 'CV Series', 'LoneStar', 'ProStar', 'WorkStar', 'DuraStar', 'PayStar', '9900i', 'TranStar'],
    'Isuzu Trucks': ['ELF 200', 'ELF 300', 'ELF 400', 'ELF 500', 'ELF 600', 'Forward 800', 'Forward 1100', 'Forward 1400', 'Giga', 'FTR'],
    'Iveco': ['Stralis', 'S-Way', 'Trakker', 'Eurocargo', 'Daily', 'Magirus'],
    'JAC Trucks': ['JunFeng', 'Shuailing', 'Geerfa'],
    'Kamaz': ['54901', '6520', '43118', '5320', '65115'],
    'Kenworth': ['T680', 'T880', 'W900', 'T370', 'T470', 'T270', 'T660', 'W990', 'T2000', 'T700', 'T440'],
    'Kenworth Mexico': ['T680 Next Gen', 'T880', 'T380', 'T480', 'KW45', 'KW55', 'T660 (Mex)', 'T800'],
    'Liaz': ['5256', '5292', '6213'],
    'Mack': ['Anthem', 'Pinnacle', 'Granite', 'TerraPro', 'LR', 'Titan', 'Vision', 'CH613'],
    'MAZ': ['5440', '6430', '5516'],
    'MAN': ['TGX', 'TGS', 'TGM', 'TGL'],
    'Mercedes-Benz Trucks': ['Actros', 'Arocs', 'Atego', 'Econic', 'Unimog', 'Zetros', 'Accelo'],
    'Mitsubishi Fuso': ['Canter', 'Fighter', 'Super Great'],
    'Navistar': ['MV', 'HV', 'LT', 'RH'],
    'Nikola': ['Tre BEV', 'Tre FCEV', 'Two'],
    'Oshkosh': ['S-Series', 'Striker', 'Stinger'],
    'Paccar': ['MX-11', 'MX-13'],
    'Peterbilt': ['579', '567', '389', '520', '348', '337', '220', '589', '386', '379'],
    'Renault Trucks': ['T-High', 'T-Range', 'C-Range', 'K-Range', 'D-Range', 'Master Trucks'],
    'Scania': ['Serie R', 'Serie S', 'Serie G', 'Serie P', 'Serie L', 'V8'],
    'Shacman': ['X3000', 'X5000', 'F3000'],
    'Sinotruk': ['Howo', 'Sitrak', 'A7'],
    'SISU': ['Polar Rock', 'Polar Timber', 'Polar Works'],
    'Sterling': ['A-Line', 'L-Line', 'Acterra'],
    'Tata Trucks': ['Prima', 'Ultra', 'Signa'],
    'Terberg': ['YT', 'RT', 'DT'],
    'UD Trucks': ['Quon', 'Quester', 'Croner', 'Kuzer'],
    'Volkswagen Camiones': ['Constellation', 'Delivery', 'Meteor', 'Worker'],
    'Volvo Trucks': ['VNL', 'VNR', 'VNX', 'VHD', 'VAH', 'FH', 'FM', 'FMX', 'FE', 'FL', 'VM'],
    'Western Star': ['47X', '49X', '57X', '4800', '4900', '6900'],

    // === AUTOBUSES ===
    'Alexander Dennis': ['Enviro200', 'Enviro400', 'Enviro500'],
    'Ankai': ['A9', 'G9', 'A6'],
    'Ashok Leyland': ['Oyster', 'Falcon', 'Cheetah'],
    'Ayco': ['Zafiro', 'Orion', 'Sigma', 'Magno'],
    'Blue Bird': ['All American', 'Vision', 'Micro Bird'],
    'Foton Bus': ['Auv', 'View'],
    'Golden Dragon': ['Navigator', 'Splendor', 'Triumph'],
    'Higer': ['H-Series', 'A-Series'],
    'Irizar': ['i8', 'i6S', 'i6', 'i4', 'i3', 'Century', 'PB'],
    'King Long': ['Apollo', 'Longwin'],
    'MAN Bus': ['Lion\'s Coach', 'Lion\'s Intercity', 'Lion\'s City'],
    'Marcopolo': ['Paradiso 1800 DD', 'Paradiso 1350', 'Paradiso 1200', 'Viaggio 1050', 'Torino', 'Boxer', 'Volare'],
    'MCI': ['J4500', 'D4505', 'D45 CRT LE'],
    'Mercedes-Benz Bus': ['O500', 'Tourismo', 'Travego', 'Intouro', 'Citaro', 'Sprinter Bus'],
    'Neoplan': ['Skyliner', 'Cityliner', 'Tourliner'],
    'Nova Bus': ['LFS', 'LFS Artic'],
    'Prevost': ['H3-45', 'X3-45'],
    'Scania Bus': ['Touring', 'Citywide', 'Interlink', 'Irizar i6 Scania'],
    'Solaris': ['Urbino', 'Trollino'],
    'Thomas Built': ['Saf-T-Liner C2', 'Saf-T-Liner EFX'],
    'Van Hool': ['EX Series', 'TDX Series'],
    'Volvo Bus': ['9700 Grand', '9800', '7900 Electric', 'B11R', 'B13R', 'Procity', 'Access'],
    'Yutong': ['ZK6122H', 'ZK6108HG', 'E12'],
    'Zhongtong': ['Lck6127', 'Navigator'],

    // === MAQUINARIA ===
    'Bell': ['B45E', 'B30E', 'B50E'],
    'Bobcat': ['S450', 'S76', 'T66', 'T870', 'E35', 'E85', 'S150', 'T190'],
    'Bomag': ['BW 211', 'BW 120', 'BW 177'],
    'Case': ['580N', 'CX210', '721G', '850L', 'SV280B', '1110EX', 'SR210', 'TR310'],
    'Caterpillar': ['320 (Excavadora)', '416 (Retro)', 'D6 (Dozer)', '950 (Cargador)', '140 (Motoniveladora)', '777 (Dúmper)', 'CB2.5 (Rodillo)', 'TH407 (Telehandler)', '336', 'D11', '988K'],
    'Claas': ['Lexion', 'Jaguar', 'Tucano', 'Arion', 'Axion'],
    'Deere & Company (John Deere)': ['6120M', '310L', '850K'],
    'Demag': ['AC 250', 'AC 100'],
    'Deutz-Fahr': ['Agrotron 6', 'AgroXtra'],
    'Dieci': ['Agri Plus', 'Hercules'],
    'Doosan': ['DX225LC', 'DL200', 'DX140W', 'DX300'],
    'Dynapac': ['CA 2500', 'CC 4200'],
    'Epiroc': ['SmartROC', 'Boomer'],
    'Fendt': ['Vario 700', 'Vario 900', 'Ideal'],
    'Gehl': ['V270', 'R190'],
    'Genie': ['S-65', 'Z-45', 'GS-1930'],
    'Haulotte': ['HA16 RTJ', 'Star 10'],
    'Hidromek': ['HMK 102B', 'HMK 230 LC'],
    'Hitachi': ['ZX210', 'ZX350', 'ZW220', 'EH4000'],
    'Hyundai Heavy Industries': ['HX220L', 'HL940'],
    'JCB': ['3CX', '4CX', 'JS220', '540-170', '4220 Fastrac', 'Teletruk', '1CX', '8026'],
    'JLG': ['860SJ', '450AJ', '1930ES'],
    'Jungheinrich': ['ETV 214', 'EFG 216'],
    'Kobelco': ['SK210', 'SK350', 'SK500'],
    'Komatsu': ['PC210', 'D65PX', 'WA380', 'GD655', 'HM400', 'PC360'],
    'Kubota': ['L3800', 'M7060', 'KX040', 'U55', 'SVL75'],
    'Landini': ['Rex 4', 'Landpower'],
    'Liebherr': ['R924', 'L550', 'LR634', 'LTM 1030', 'PR736'],
    'Linde': ['H25', 'E20'],
    'Liugong': ['856H', '922E', '4180D'],
    'Lonking': ['CDM833', 'LG855N'],
    'Mahindra Agriculture': ['Oja', 'Novo', 'Yuvo'],
    'Manitou': ['MT 733', 'MRT 2150', 'MLT 625'],
    'Massey Ferguson': ['MF 4700', 'MF 7700', 'MF 8700'],
    'McCormick': ['X7 VT-Drive', 'X4'],
    'Metso': ['Lokotrack LT106', 'Nordberg'],
    'New Holland': ['T6', 'T7', 'T8', 'W170', 'B95B', 'L320'],
    'Palfinger': ['PK 19000', 'PK 23500'],
    'Sany': ['SY215C', 'SY365H', 'SY75C'],
    'Sandvik': ['LH517i', 'DD422i'],
    'SDLG': ['LG956L', 'G9190'],
    'Shantui': ['SD16', 'SD32'],
    'Still': ['RX 20', 'RX 60'],
    'Sumitomo': ['SH210', 'SH350'],
    'Takeuchi': ['TB230', 'TL12'],
    'Terex': ['Finlay J-1170', 'TR60'],
    'Terex Finlay': ['J-1175', '883+'],
    'Valtra': ['T Series', 'A Series'],
    'Volvo CE': ['EC220E', 'L120H', 'A30G', 'G930'],
    'Wacker Neuson': ['EZ17', 'DW60'],
    'XCMG': ['XE215C', 'GR215', 'LW500FN'],
    'Yanmar': ['ViO25', 'SV18'],
    'Zoomlion': ['ZTC250N', 'ZE215E'],

    // === ESPECIAL / RECREATIVO ===
    'Adria': ['Matrix', 'Coral', 'Twin', 'Altea'],
    'Airstream': ['Bambi', 'Caravel', 'Flying Cloud', 'International', 'Classic'],
    'BRP (Can-Am)': ['Maverick X3', 'Maverick R', 'Defender', 'Commander', 'Outlander', 'Renegade', 'Spyder', 'Ryker', 'Traxter'],
    'CFMoto Specials': ['ZForce 1000', 'UForce 1000', 'CForce 600'],
    'Club Car': ['Precedent', 'Onward', 'Carryall'],
    'Cushman': ['Hauler', 'Shuttle'],
    'E-Z-GO': ['Freedom', 'Valor', 'Express'],
    'Forest River': ['Rockwood', 'Flagstaff', 'Salem', 'Wildwood', 'Cherokee'],
    'Grand Design': ['Reflection', 'Imagine', 'Solitude', 'Momentum'],
    'Hisun': ['Sector', 'Strike', 'Forge'],
    'Honda Powersports': ['Talon 1000', 'Pioneer 1000', 'Foreman', 'Rancher', 'Trx250', 'Rubicon', 'Rincon'],
    'Hymer': ['B-Class', 'Exsis', 'T-Class', 'ML-T', 'Grand Canyon'],
    'Jayco': ['Jay Flight', 'Eagle', 'Pinnacle', 'Seneca', 'Greyhawk'],
    'John Deere Gator': ['XUV835', 'XUV865'],
    'Kabe': ['Royal', 'Imperial'],
    'Kawasaki Mule': ['PRO-FXT', 'PRO-MX'],
    'Kubota RTV': ['X1100C', 'X900'],
    'Kymco UXV': ['700i', '450i'],
    'Niesmann+Bischoff': ['Arto', 'Flair'],
    'Polaris RZR': ['Pro R', 'Turbo R', 'XP 1000'],
    'Segway Powersports': ['Villain', 'Fugleman', 'Snarler'],
    'Thor Motor Coach': ['Four Winds', 'Chateau', 'Ais', 'Palazzo'],
    'Tiffin': ['Allegro', 'Phaeton', 'Zephyr'],
    'Winnebago': ['Vista', 'Adventurer', 'Revel', 'Solis', 'Ekko'],
    'Yamaha Side-by-Side': ['YXZ1000R', 'Wolverine RMAX', 'Viking', 'Rhino (Classic)', 'Wolverine X2']
}

// ⚙️ Technical Specs Options
export const TRANSMISSIONS = ['Manual', 'Automática', 'CVT', 'Dual Clutch (DCT)', 'Tiptronic', 'Secuencial', 'Semi-automática']
export const FUELS = ['Gasolina', 'Diésel', 'Híbrido (HEV)', 'Híbrido Enchufable (PHEV)', 'Eléctrico (BEV)', 'Gas LP', 'Gas Natural (GNC)', 'Hidrógeno (FCEV)', 'Etanol']
export const TRACTIONS = ['Delantera (FWD)', 'Trasera (RWD)', '4x4 (4WD)', 'Integral (AWD)', '6x4', '6x6', '8x4', '8x8']
export const COLORS = ['Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Café', 'Beige', 'Oro', 'Bronce', 'Morado', 'Rosa', 'Bicolor', 'Mate', 'Otro']
export const CONDITIONS = ['Nuevo', 'Seminuevo (Casi Nuevo)', 'Usado', 'Para Restaurar', 'Para Piezas']

// 🌍 DICCIONARIO GLOBAL DE SINÓNIMOS (Base de Conocimiento para Inteligencia Artificial)
// Mapea términos coloquiales e internacionales a la taxonomía oficial de la BD
export const GLOBAL_SYNONYMS: Record<string, string> = {
    // Categorías
    'Carro': 'Automóvil', 'Coche': 'Automóvil', 'Auto': 'Automóvil', 'Nave': 'Automóvil', 'Fierro': 'Automóvil',
    'Voiture': 'Automóvil', 'Car': 'Automóvil', 'Vehicle': 'Automóvil',
    'Troca': 'Automóvil', 'Pickup': 'Automóvil', 'Camioneta': 'Automóvil', 'Truck': 'Automóvil',
    'Moto': 'Motocicleta', 'Burra': 'Motocicleta', 'Bike': 'Motocicleta', 'Motorcycle': 'Motocicleta',
    'Mano de chango': 'Maquinaria', 'Retro': 'Maquinaria', 'Excavator': 'Maquinaria',
    'Tracto': 'Camión', 'Trailer': 'Camión', 'Mula': 'Camión', 'Semi': 'Camión', 'Lorry': 'Camión',

    // Colores
    'Negra': 'Negro', 'Black': 'Negro', 'Noir': 'Negro', 'Dark': 'Negro', 'Preto': 'Negro',
    'Blanca': 'Blanco', 'White': 'Blanco', 'Blanc': 'Blanco', 'Branco': 'Blanco',
    'Roja': 'Rojo', 'Red': 'Rojo', 'Rouge': 'Rojo', 'Vermelho': 'Rojo',
    'Azul Oscuro': 'Azul', 'Blue': 'Azul', 'Bleu': 'Azul',
    'Gris rata': 'Gris', 'Grey': 'Gris', 'Silver': 'Plata', 'Plateado': 'Plata',

    // Marcas / Modelos (Slang)
    'Chevy': 'Chevrolet', 'Bimmer': 'BMW', 'Beema': 'BMW', 'Merc': 'Mercedes-Benz', 'Meche': 'Mercedes-Benz',
    'Lambo': 'Lamborghini', 'Rari': 'Ferrari', 'Vw': 'Volkswagen', 'Vocho': 'Volkswagen', 'Fusca': 'Volkswagen',
    'Mamalona': 'RAM', 'Yota': 'Toyota'
}

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
 * 🔢 Formatea un número según el locale
 */
export const formatNumber = (num: any, locale: string = 'es') => {
    try {
        const val = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(val)) return '0';
        return new Intl.NumberFormat(getIntlLocale(locale)).format(val);
    } catch (e) {
        return String(num || '0');
    }
}

/**
 * 💰 Formatea el precio con separadores de miles y moneda
 */
export const formatPrice = (price: any, currency: string = 'MXN', locale: string = 'es') => {
    try {
        const val = typeof price === 'string' ? parseFloat(price) : price;
        if (isNaN(val)) return `${currency} 0`;

        const formatter = new Intl.NumberFormat(getIntlLocale(locale), {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        const formattedPrice = formatter.format(val);

        // Agregar el código de moneda al final para mayor claridad
        // Ejemplo: "$98,689,895 MXN" en lugar de solo "$98,689,895"
        if (!formattedPrice.includes(currency)) {
            return `${formattedPrice} ${currency}`;
        }
        return formattedPrice;
    } catch (e) {
        return `${currency} ${formatNumber(price, locale)}`;
    }
}

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../src/locales');

// English translations for ALL discovered missing blocks
const missingTranslations = {
    appointment: {
        modal_title: "🛡️ Schedule Safe Meeting",
        date_label: "Date",
        time_label: "Time",
        location_label: "Meeting Point",
        safe_places_title: "🛡️ Safe Meeting Points",
        loading_places: "Searching safe places nearby...",
        custom_location_check: "Choose custom location or manual map",
        custom_location_placeholder: "Ex. Main Plaza Parking...",
        cancel: "Cancel",
        submit: "Confirm Safe Meeting"
    },
    share_modal: {
        title: "Share Profile",
        subtitle: "Scan or share the direct link",
        direct_link: "Direct link",
        copy_link: "Copy Link",
        copied: "Copied!",
        download_qr: "Download QR",
        send_whatsapp: "Send via WhatsApp",
        write_number: "Enter number (10 digits)",
        send: "Send",
        tip: "When sharing from the web, the link will open directly the optimized version for any device."
    },
    market: {
        sort: {
            label: "Sort by",
            newest: "Newest",
            price_asc: "Price: Low to High",
            price_desc: "Price: High to Low",
            year_desc: "Year: Newest",
            year_asc: "Year: Oldest",
            mileage_asc: "Lowest Mileage"
        },
        features: {
            label: "Premium Features",
            gps: "GPS / Navigation",
            leather: "Leather Seats",
            sunroof: "Sunroof / Panoramic Roof",
            ac: "Air Conditioning",
            bluetooth: "Bluetooth / Premium Audio",
            camera: "Backup Camera",
            sensors: "Parking Sensors",
            android_carplay: "Android Auto / CarPlay",
            heated_seats: "Heated Seats"
        }
    },
    publish: {
        titles: {
            validation: {
                title: "Photos not verified",
                description: "The system could not automatically verify all details from the photos. Do you want to continue manually?",
                continue: "Continue",
                review: "Review"
            }
        },
        labels: {
            country: "Country",
            state: "State or Region",
            city: "City"
        },
        placeholders: {
            state: "Ex: Texas, California, Bavaria",
            city: "Ex: Houston, Los Angeles, Munich"
        }
    },
    business: {
        loading: "Loading businesses..."
    },
    map_store: {
        search_placeholder: "🔍 Search street, neighborhood or place..."
    },
    messages: {
        tips: {
            buyer: {
                title: "Buyer Tips",
                t1: "Never send money in advance to 'reserve'.",
                t2: "Check the car at REPUVE to verify it's not stolen.",
                t3: "Always meet in busy public places (Malls, Banks).",
                t4: "Verify that the VIN matches on chassis and papers.",
                t5: "Don't carry large amounts of cash. Prefer bank transfer.",
                t6: "If the price is too good to be true, be suspicious.",
                t7: "Verify that the seller matches the name on the original invoice.",
                t8: "Ask for a video call first to confirm the vehicle exists and runs.",
                t9: "Do not share sensitive personal data like your exact address via chat.",
                t10: "Check that the engine has no oil leaks or strange noises when starting cold.",
                t11: "Ask if the car has a history of accidents or major repairs.",
                t12: "Verify that documents have no erasures or alterations.",
                t13: "If paying by transfer, do it inside a bank branch.",
                t14: "Check the condition of tires and suspension; these are expensive fixes.",
                t15: "Be wary of sellers claiming to be in another city asking for 'shipping' deposits.",
                t16: "Take a professional mechanic to scan the car's computer."
            },
            seller: {
                title: "Seller Tips",
                t1: "Do not handover the car until payment is verified in your account.",
                t2: "Show the car in safe places, never at your home.",
                t3: "Go accompanied to the showing.",
                t4: "Do not handover original documents until the sale is closed.",
                t5: "Request the buyer's ID before the test drive.",
                t6: "If payment is in cash, verify it at a bank to avoid fake bills.",
                t7: "Do not let the buyer take the car with just a 'transfer photo'; check your balance.",
                t8: "Make a liability letter or sales contract to release yourself from future fines.",
                t9: "Deliver the car in a place with security cameras.",
                t10: "Do not accept payments in 'installments' or cashier's checks you can't cash immediately.",
                t11: "Cancel your insurance immediately after the new owner takes the car.",
                t12: "Keep a copy of the buyer's ID and proof of address.",
                t13: "Ensure the buyer signs for receiving documents and keys.",
                t14: "Be wary of buyers who don't ask technical questions and want to close the deal too fast.",
                t15: "If the buyer comes from another city, agree on an easy-to-access and safe intermediate point."
            },
            general: {
                title: "General Safety",
                desc: "CarMatch only connects users. We do not intervene in payments or shipping. You are primarily responsible for your safety."
            }
        },
        safety_mode: {
            active: "🛡️ Safe Mode Active",
            active_desc: "Monitoring your meeting in real-time",
            confirm_end: "Are you sure you want to end the meeting? This will deactivate safety mode.",
            end_btn: "End Safe Meeting",
            sos_btn: "SOS (911)",
            sos_confirm: "Call Emergency?",
            sos_desc: "This will share the user's last known location with authorities (simulated).",
            call_now: "Call Now",
            cancel: "Cancel",
            check_in_title: "Safety Check",
            check_in_body: "Is everything going well with your meeting?",
            still_here: "Yes, still negotiating",
            emergency: "No, I need help"
        },
        safety_shield: "Safety Guide"
    },
    edit_profile: {
        title: "Edit Profile",
        creative_idea: "Creative Idea:",
        creative_desc: "Why not use a fun name?",
        recommendation: "Recommendation:",
        rec_desc: "Use a photo where you look trustworthy.",
        name_label: "Profile Name",
        name_placeholder: "Ex: John Doe",
        photo_label: "Profile Photo",
        your_vehicles: "Your Vehicles",
        security_sos: "SOS Security",
        sos_desc: "Select a CarMatch user to be your emergency contact.",
        remove: "Remove",
        search_user: "Search user by name...",
        sos_warning: "If you activate an SOS during a meeting, this contact will receive your location and the other person's.",
        cancel: "Cancel",
        save_changes: "Save Changes",
        saving: "Saving...",
        labels: {
            "title": "Ad Title",
            "description": "Description",
            "brand": "Make",
            "model": "Model",
            "year": "Year",
            "price": "Price",
            "transmission": "Transmission",
            "fuel": "Fuel",
            "condition": "Condition",
            "color": "Color",
            "mileage": "Mileage",
            "km": "Kilometers",
            "mi": "Miles",
            "doors": "Doors",
            "engine": "Engine",
            "displacement": "Displacement",
            "operating_hours": "Operating Hours",
            "cargo_capacity": "Cargo Capacity",
            "engine_info": "Engine and Cargo Information",
            "engine_displacement": "Engine / Displacement",
            "features_title": "Equipment and Features",
            "features_subtitle": "Select the highlighted equipment of your {brand}.",
            "vehicle_photos": "Vehicle Photos",
            "location_not_selected": "Location not selected",
            "country": "Country",
            "state": "State or Region",
            "city": "City"
        },
        validation: {
            "review_required": "Review required:",
            "missing_brand": "Missing make",
            "missing_model": "Missing model",
            "missing_year": "Missing year",
            "invalid_price": "Invalid price",
            "missing_images": "At least one image is required",
            "missing_city": "City not selected"
        },
        tips: {
            "title": "Tips for your post",
            "honest_title": "Be honest and detailed:",
            "honest_desc": "Mention the real status of the title, taxes, and if the vehicle has had incidents or mechanical failures. This builds trust.",
            "safety_title": "Meeting point:",
            "safety_desc": "We recommend arranging the review of documents and the vehicle in a public and safe place.",
            "transparency_title": "Transparency:",
            "transparency_desc": "A clear description of the maintenance performed helps sell faster."
        }
    },
    taxonomy: {
        categories: {
            "Automóvil": "Automobile",
            "Motocicleta": "Motorcycle",
            "Camión": "Truck",
            "Autobús": "Bus",
            "Maquinaria": "Machinery",
            "Especial": "Special"
        },
        subtypes: {
            "Sedán": "Sedan",
            "SUV": "SUV",
            "Pickup": "Pickup",
            "Deportivo": "Sport",
            "Convertible": "Convertible",
            "Coupe": "Coupe",
            "Hatchback": "Hatchback",
            "Minivan": "Minivan",
            "Wagon": "Wagon",
            "Crossover": "Crossover",
            "Limusina": "Limousine",
            "Microcar": "Microcar",
            "Roadster": "Roadster",
            "Moke": "Moke",
            "Targa": "Targa",
            "Shooting Brake": "Shooting Brake",
            "Deportiva": "Sportbike",
            "Cruiser": "Cruiser",
            "Touring": "Touring",
            "Off-road": "Off-road",
            "Scooter": "Scooter",
            "Chopper": "Chopper",
            "Naked": "Naked",
            "Dual-Sport": "Dual-Sport",
            "Adventure": "Adventure",
            "Cafe Racer": "Cafe Racer",
            "Scrambler": "Scrambler",
            "Enduro": "Enduro",
            "Motocross": "Motocross",
            "Trial": "Trial",
            "Triciclo (Spyder/Ryker)": "Tricycle (Spyder/Ryker)",
            "Cuatrimoto (ATV)": "ATV / Quad",
            "Moped": "Moped",
            "Pocket Bike": "Pocket Bike",
            "Supermoto": "Supermoto",
            "Tractocamión (Trailer)": "Semi Truck (Trailer)",
            "Torton": "Torton Truck",
            "Rabon": "Rabon Truck",
            "Pickup Heavy Duty": "Heavy Duty Pickup",
            "Volteo": "Dump Truck",
            "Cisterna (Pipa)": "Tanker Truck",
            "Refrigerado": "Refrigerated",
            "Plataforma": "Flatbed",
            "Caja Seca": "Dry Van",
            "Grúa": "Tow Truck",
            "Hormigonera (Olla)": "Concrete Mixer",
            "Portacoches (Madrina)": "Car Hauler",
            "Basurero": "Garbage Truck",
            "Chasis Cabina": "Chassis Cab",
            "Bomberos (Camión)": "Fire Truck",
            "Blindado (Valores)": "Armored Truck",
            "Compactador": "Compactor",
            "Madre (Nodriza)": "Nursery Truck",
            "Urbano": "City Bus",
            "Interurbano": "Intercity Bus",
            "Turismo": "Touring Bus",
            "Escolar": "School Bus",
            "Microbús": "Minibus",
            "Van Pasajeros": "Passenger Van",
            "Articulado": "Articulated Bus",
            "Dos Pisos": "Double Decker",
            "Trolebús": "Trolleybus",
            "Minibús": "Minibus",
            "Shuttle Bus": "Shuttle Bus",
            "Excavadora": "Excavator",
            "Retroexcavadora": "Backhoe",
            "Bulldozer": "Bulldozer",
            "Montacargas": "Forklift",
            "Tractor Agrícola": "Farm Tractor",
            "Cosechadora": "Harvester",
            "Rodillo Compactador": "Steam Roller",
            "Pavimentadora": "Paver",
            "Grúa Industrial": "Industrial Crane",
            "Cargador Frontal": "Front Loader",
            "Minicargador": "Skid Steer",
            "Sembradora": "Seeder",
            "Motoconformadora": "Motor Grader",
            "Telehandler": "Telehandler",
            "Sideboom": "Sideboom",
            "Barredora Industrial": "Industrial Sweeper",
            "Zanjadora": "Trencher",
            "Perforadora": "Drilling Rig",
            "UTV (RZR / Maverick / Side-by-Side)": "UTV (Side-by-Side)",
            "Buggy / Arenero": "Buggy / Sand Rail",
            "Golf Cart": "Golf Cart",
            "Go-kart": "Go-kart",
            "Motonieve": "Snowmobile",
            "Ambulancia": "Ambulance",
            "Patrulla": "Police Patrol",
            "Bomberos": "Firefighting",
            "Blindado": "Armored",
            "Food Truck": "Food Truck",
            "Casa Rodante (RV)": "Motorhome (RV)",
            "Remolque": "Trailer",
            "Lowboy": "Lowboy Trailer",
            "Remolque Frigorífico": "Reefer Trailer",
            "Plataforma Porta-contenedor": "Container Chassis"
        },
        transmission: {
            "Manual": "Manual",
            "Automática": "Automatic",
            "CVT": "CVT",
            "Dual Clutch (DCT)": "Dual Clutch (DCT)",
            "Tiptronic": "Tiptronic",
            "Secuencial": "Sequential",
            "Semi-automática": "Semi-automatic"
        },
        fuel: {
            "Gasolina": "Gasoline",
            "Diésel": "Diesel",
            "Híbrido (HEV)": "Hybrid (HEV)",
            "Híbrido Enchufable (PHEV)": "Plug-in Hybrid (PHEV)",
            "Eléctrico (BEV)": "Electric (BEV)",
            "Gas LP": "LP Gas",
            "Gas Natural (GNC)": "Natural Gas (CNG)",
            "Hidrógeno (FCEV)": "Hydrogen (FCEV)",
            "Etanol": "Ethanol"
        },
        traction: {
            "Delantera (FWD)": "Front Wheel Drive (FWD)",
            "Trasera (RWD)": "Rear Wheel Drive (RWD)",
            "4x4 (4WD)": "4x4 (4WD)",
            "Integral (AWD)": "All Wheel Drive (AWD)",
            "6x4": "6x4",
            "6x6": "6x6",
            "8x4": "8x4",
            "8x8": "8x8"
        },
        condition: {
            "Nuevo": "New",
            "Seminuevo (Casi Nuevo)": "Pre-owned",
            "Usado": "Used",
            "Para Restaurar": "To Restore",
            "Para Piezas": "For Parts"
        },
        colors: {
            "Blanco": "White",
            "Negro": "Black",
            "Gris": "Gray",
            "Plata": "Silver",
            "Rojo": "Red",
            "Azul": "Blue",
            "Verde": "Green",
            "Amarillo": "Yellow",
            "Naranja": "Orange",
            "Café": "Brown",
            "Beige": "Beige",
            "Oro": "Gold",
            "Bronce": "Bronze",
            "Morado": "Purple",
            "Rosa": "Pink",
            "Bicolor": "Two-tone",
            "Mate": "Matte",
            "Otro": "Other"
        },
        units: {
            "cc": "cc",
            "hp": "HP",
            "l": "L",
            "km": "km",
            "mi": "mi",
            "prices": {
                "placeholder_min": "$0",
                "placeholder_max": "$Max"
            }
        }
    },
    share: {
        share_in: "Share on...",
        link_copied: "Link copied!",
        copied: "Copied",
        share: "Share"
    },
    image_upload: {
        error_upload: "Error uploading image",
        max_limit: "Maximum {max} images allowed",
        error_retry: "Error uploading images. Please try again.",
        business_desc: "This photo will appear on your business card.",
        vehicle_desc: "Upload up to {max} photos. The first one will be the main photo.",
        change_gallery: "Change (Gallery)",
        choose_gallery: "Choose Gallery",
        take_photo: "Take Photo",
        main_photo: "Main"
    },
    landing: {
        advantage_header: "THE CARMATCH ADVANTAGE",
        advantage_p2p_title: "Direct P2P Deal",
        advantage_p2p_desc: "No middlemen or abusive commissions. Talk direct to the owner.",
        advantage_360_title: "360° Visibility",
        advantage_360_desc: "Post once and appear everywhere: Swipe, Marketplace and Map.",
        advantage_safety_title: "Human Security",
        advantage_safety_desc: "Every post is reviewed by our security team."
    },
    admin: {
        dashboard: "Dashboard",
        intelligence: "Intelligence",
        users: "Users",
        inventory: "Inventory",
        mapstore: "MapStore",
        ai_hub: "AI Hub",
        reports: "Reports",
        logs: "Logs",
        share_app: "Share App",
        system_healthy: "System Healthy",
        live_activity: "Live Activity",
        real_time: "Real Time",
        satellite_loading: "Loading Satellite...",
        user_growth: "User Growth",
        total_sales: "Total Sales (Est.)",
        active_appointments: "Active Meetings",
        insight_engine: "AI Insight Engine",
        insight_engine_desc: "Predictive market analysis based on real activity",
        run_analysis: "Run Master Analysis",
        processing: "Processing Data...",
        strategic_summary: "Strategic Summary",
        blue_oceans: "Blue Oceans Detected",
        waiting_data: "Waiting for input charts...",
        ai_hub_help: "Click the button above to generate AI insights",
        recent_activity: "Recent Activity",
        view_audit: "View Full Audit",
        user_management: "User Management",
        search_user: "Search user...",
        global_inventory: "Global Inventory",
        export_csv: "Export CSV",
        moderation_center: "Moderation Center",
        no_description: "No additional description.",
        by: "by",
        audit_log: "Audit Log",
        clear_logs: "Clear Logs",
        unauthorized: "You don't have admin permissions",
        actions: {
            activate: "Activate",
            deactivate: "Deactivate",
            delete: "Delete",
            ignore: "Ignore",
            resolve: "Resolve",
            hide: "Hide",
            show: "Show",
            manage_credits: "Manage Credits"
        },
        status: {
            active: "ACTIVE",
            inactive: "INACTIVE",
            pending: "PENDING",
            resolved: "RESOLVED"
        }
    }
};

function deepMerge(target, source) {
    if (typeof source !== 'object' || source === null) {
        return source;
    }
    if (typeof target !== 'object' || target === null) {
        target = {};
    }
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (source[key] instanceof Object && !Array.isArray(source[key])) {
                target[key] = deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
}

try {
    const files = fs.readdirSync(localesDir);

    files.forEach(file => {
        if (!file.endsWith('.json')) return;
        if (file === 'es.json') return;

        const filePath = path.join(localesDir, file);
        console.log(`Processing ${file}...`);

        let content = {};
        try {
            const raw = fs.readFileSync(filePath, 'utf8');
            content = JSON.parse(raw);
        } catch (e) {
            console.error(`Error reading ${file}:`, e);
            return;
        }

        // 1. Root keys
        if (!content.appointment) content.appointment = missingTranslations.appointment;
        if (!content.share_modal) content.share_modal = missingTranslations.share_modal;

        // 2. Complex Merges
        ['messages', 'market', 'publish', 'business', 'map_store', 'edit_profile', 'taxonomy', 'share', 'image_upload', 'landing', 'admin'].forEach(key => {
            if (content[key]) {
                content[key] = deepMerge(content[key], missingTranslations[key]);
            } else {
                content[key] = missingTranslations[key];
            }
        });

        fs.writeFileSync(filePath, JSON.stringify(content, null, 4), 'utf8');
        console.log(`Updated ${file}`);
    });

    console.log('Synchronization complete!');

} catch (err) {
    console.error("Fatal error:", err);
}

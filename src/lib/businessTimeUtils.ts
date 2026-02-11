// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

/**
 * Utilidades para manejar los horarios de los negocios en CarMatch
 */

export interface BusinessHours {
    isOpen: boolean;
    statusText: string;
    nextAction?: string;
}

export function getBusinessStatus(hours: string | null, is24Hours: boolean): BusinessHours {
    if (is24Hours) {
        return { isOpen: true, statusText: 'Abierto 24 horas' };
    }

    if (!hours || hours.trim() === '') {
        return { isOpen: false, statusText: 'Consultar horario' };
    }

    try {
        // Formato esperado: "09:00 - 18:00" o "9:00 AM - 6:00 PM"
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        // Limpiar el string y separar
        const parts = hours.split('-').map(p => p.trim());
        if (parts.length !== 2) return { isOpen: false, statusText: 'Horario especial' };

        const parseTime = (timeStr: string) => {
            let [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (modifier) {
                if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
                if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
            }
            return hours * 60 + (minutes || 0);
        };

        const startTime = parseTime(parts[0]);
        const endTime = parseTime(parts[1]);

        // Manejo de horarios que cruzan la medianoche
        let isOpen = false;
        if (startTime < endTime) {
            isOpen = currentTime >= startTime && currentTime <= endTime;
        } else {
            // Ejemplo: 22:00 - 06:00
            isOpen = currentTime >= startTime || currentTime <= endTime;
        }

        return {
            isOpen,
            statusText: isOpen ? 'Abierto ahora' : 'Cerrado',
            nextAction: isOpen ? `Cierra a las ${parts[1]}` : `Abre a las ${parts[0]}`
        };
    } catch (e) {
        return { isOpen: false, statusText: 'Consultar horario' };
    }
}

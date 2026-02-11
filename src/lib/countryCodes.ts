// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.

export interface CountryCode {
    name: string
    code: string
    dial_code: string
    flag: string
    phoneLength?: number
}

export const COUNTRY_CODES: CountryCode[] = [
    { name: "México", code: "MX", dial_code: "+52", flag: "🇲🇽", phoneLength: 10 },
    { name: "Estados Unidos", code: "US", dial_code: "+1", flag: "🇺🇸", phoneLength: 10 },
    { name: "Canadá", code: "CA", dial_code: "+1", flag: "🇨🇦", phoneLength: 10 },
    { name: "España", code: "ES", dial_code: "+34", flag: "🇪🇸" },
    { name: "Colombia", code: "CO", dial_code: "+57", flag: "🇨🇴" },
    { name: "Argentina", code: "AR", dial_code: "+54", flag: "🇦🇷" },
    { name: "Perú", code: "PE", dial_code: "+51", flag: "🇵🇪" },
    { name: "Chile", code: "CL", dial_code: "+56", flag: "🇨🇱" },
    { name: "Brasil", code: "BR", dial_code: "+55", flag: "🇧🇷" },
    { name: "Ecuador", code: "EC", dial_code: "+593", flag: "🇪🇨" },
    { name: "Venezuela", code: "VE", dial_code: "+58", flag: "🇻🇪" },
    { name: "Guatemala", code: "GT", dial_code: "+502", flag: "🇬🇹" },
    { name: "Cuba", code: "CU", dial_code: "+53", flag: "🇨🇺" },
    { name: "Bolivia", code: "BO", dial_code: "+591", flag: "🇧🇴" },
    { name: "República Dominicana", code: "DO", dial_code: "+1-809", flag: "🇩🇴" },
    { name: "Honduras", code: "HN", dial_code: "+504", flag: "🇭🇳" },
    { name: "Paraguay", code: "PY", dial_code: "+595", flag: "🇵🇾" },
    { name: "El Salvador", code: "SV", dial_code: "+503", flag: "🇸🇻" },
    { name: "Nicaragua", code: "NI", dial_code: "+505", flag: "🇳🇮" },
    { name: "Costa Rica", code: "CR", dial_code: "+506", flag: "🇨🇷" },
    { name: "Panamá", code: "PA", dial_code: "+507", flag: "🇵🇦" },
    { name: "Uruguay", code: "UY", dial_code: "+598", flag: "🇺🇾" },
    { name: "Francia", code: "FR", dial_code: "+33", flag: "🇫🇷" },
    { name: "Alemania", code: "DE", dial_code: "+49", flag: "🇩🇪" },
    { name: "Italia", code: "IT", dial_code: "+39", flag: "🇮🇹" },
    { name: "Reino Unido", code: "GB", dial_code: "+44", flag: "🇬🇧" },
    { name: "China", code: "CN", dial_code: "+86", flag: "🇨🇳" },
    { name: "Japón", code: "JP", dial_code: "+81", flag: "🇯🇵" },
    { name: "Corea del Sur", code: "KR", dial_code: "+82", flag: "🇰🇷" },
    { name: "India", code: "IN", dial_code: "+91", flag: "🇮🇳" }
]

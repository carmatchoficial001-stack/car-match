// 🛡️ PROHIBIDO MODIFICAR SIN ORDEN EXPLÍCITA DEL USUARIO (Ver PROJECT_RULES.md)
// ⚠️ CRITICAL WARNING: FILE PROTECTED BY PROJECT RULES.
// DO NOT MODIFY THIS FILE WITHOUT EXPLICIT USER INSTRUCTION.


import { geminiFlash, geminiPro, geminiFlashPrecise, geminiFlashConversational } from "./geminiModels";
import aiCache from "./aiCache";
import { parseNaturalSearch } from "../searchParser";

/**
 * 🎭 CARMATCH AI ORCHESTRATOR - Team Leader
 * "Servicio 7 Estrellas al Menor Costo"
 */

export type AIAgentRole = 'INTERPRETER' | 'MODERATOR' | 'SECURITY' | 'ANALYST';
export type AIEfficiencyLevel = 'LOCAL_FIRST' | 'FLASH_ONLY' | 'PRO_VERIFIED';

interface OrchestrationOptions {
    role: AIAgentRole;
    efficiency?: AIEfficiencyLevel;
    useCache?: boolean;
    context?: any;
}

class AIOrchestrator {
    /**
     * Procesa una tarea delegando al equipo de agentes según la cascada de eficiencia
     */
    async execute(task: string, options: OrchestrationOptions) {
        const { role, efficiency = 'LOCAL_FIRST', useCache = true, context = {} } = options;

        console.log(`🎭 [Orchestrator] Iniciando tarea: ${role} | Nivel: ${efficiency}`);

        // 🚀 NIVEL 1: HEURÍSTICA LOCAL (Costo $0)
        if (efficiency === 'LOCAL_FIRST' && role === 'INTERPRETER') {
            const localResult = parseNaturalSearch(task);
            if (Object.keys(localResult).length > 0) {
                console.log("✅ [Nivel 1] Resuelto localmente sin gastar tokens.");
                return {
                    source: 'LOCAL',
                    data: localResult,
                    confidence: 0.9
                };
            }
        }

        // 🚀 NIVEL 2: CACHÉ SEMÁNTICO (Costo ~$0)
        if (useCache) {
            const cached = aiCache.get(task, role);
            if (cached) {
                return {
                    source: 'CACHE',
                    data: cached,
                    confidence: 1.0
                };
            }
        }

        // 🚀 NIVEL 3: AGENTE FLASH (Costo Mínimo)
        try {
            const model = this.getModelForRole(role, 'FLASH');
            console.log(`⚡ [Nivel 3] Llamando a Agente Flash para ${role}`);

            const result = await model.generateContent(this.buildPrompt(task, role, context));
            const responseText = result.response.text();
            const data = this.parseJSON(responseText);

            if (data && useCache) {
                aiCache.set(task, data, role);
            }

            // 🚀 NIVEL 4: VALIDACIÓN PRO (Solo si es indispensable)
            if (efficiency === 'PRO_VERIFIED' || (data && data.uncertainty > 0.7)) {
                return await this.verifyWithPro(task, data, role, context);
            }

            return {
                source: 'FLASH',
                data,
                confidence: 0.8
            };

        } catch (error) {
            console.error(`❌ Error en Nivel 3:`, error);
            // Fallback directo a Pro si Flash falla catastróficamente
            return await this.verifyWithPro(task, null, role, context);
        }
    }

    private getModelForRole(role: AIAgentRole, tier: 'FLASH' | 'PRO') {
        if (tier === 'PRO') return geminiPro;

        switch (role) {
            case 'INTERPRETER': return geminiFlashPrecise;
            case 'MODERATOR': return geminiFlashPrecise;
            case 'ANALYST': return geminiFlash;
            default: return geminiFlash;
        }
    }

    private async verifyWithPro(task: string, flashData: any, role: AIAgentRole, context: any) {
        console.log(`👑 [Nivel 4] Agente PRO entrando a verificar (Servicio 7 Estrellas)`);
        const model = geminiPro;

        const proPrompt = `
            ERES EL AUDITOR SENIOR 7-ESTRELLAS DE CARMATCH.
            Tarea original: ${task}
            Resultado previo (posiblemente erróneo): ${JSON.stringify(flashData)}
            Contexto: ${JSON.stringify(context)}
            
            Tu trabajo es refinar el resultado para que sea PERFECTO y SIN ERRORES.
            Responde ÚNICAMENTE con el JSON final corregido.
        `;

        const result = await model.generateContent(proPrompt);
        const data = this.parseJSON(result.response.text());

        return {
            source: 'PRO',
            data,
            confidence: 1.0
        };
    }

    private buildPrompt(task: string, role: AIAgentRole, context: any) {
        // Micro-prompting según rol
        return `Rol: ${role}. Tarea: ${task}. Contexto: ${JSON.stringify(context)}. Responde solo JSON.`;
    }

    private parseJSON(text: string) {
        try {
            const match = text.match(/\{[\s\S]*\}/);
            return match ? JSON.parse(match[0]) : null;
        } catch {
            return null;
        }
    }
}

export const orchestrator = new AIOrchestrator();

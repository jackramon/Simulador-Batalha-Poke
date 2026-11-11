
import { Pokemon } from '../../../../types';
import { calculateStat } from '../statCalculator';

/**
 * Lógica para o movimento Tera Explosão (Tera Blast).
 * 1. O tipo do movimento torna-se o tipo Tera do usuário se estiver Terastalizado.
 * 2. O movimento torna-se físico se o Ataque do usuário for maior que seu Atq. Especial (apenas se Terastalizado).
 */

export function getTeraBlastType(attacker: Pokemon): string {
    if (attacker.isTerastallized && attacker.teraType) {
        return attacker.teraType;
    }
    return 'normal';
}

export function getTeraBlastCategory(
    attacker: Pokemon, 
    weather: string, 
    isGasActive: boolean
): 'physical' | 'special' {
    // Se não estiver terastalizado, é sempre especial (Normal)
    if (!attacker.isTerastallized) {
        return 'special';
    }

    // Calcula os status efetivos (considerando boosts, naturezas, etc.)
    // Nota: Tera Blast usa os stats brutos modificados por estágios para decidir a categoria.
    // Como Tera Blast não tem acesso direto ao estado de terreno nesta função e a lógica
    // é apenas para determinar categoria baseada no maior stat, assumimos 'none' para terreno
    // para evitar complexidade excessiva de assinaturas, a menos que Hadron Engine seja crítico para Tera Blast.
    
    // O cálculo de stat em calculateStat já aplica stages se ignoreStages=false (padrão é false).
    const atk = calculateStat(attacker, 'attack', weather, isGasActive, false, 'none');
    const spa = calculateStat(attacker, 'spAttack', weather, isGasActive, false, 'none');

    // Se Ataque > Atq. Especial, vira Físico. Caso contrário, mantém Especial.
    return atk > spa ? 'physical' : 'special';
}

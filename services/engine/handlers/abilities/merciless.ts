
import { Pokemon } from '../../../../types';

/**
 * Verifica se a habilidade Impiedoso (Merciless) deve garantir um acerto crítico.
 * Regra: Se o alvo estiver envenenado ou gravemente envenenado (toxic), 
 * os ataques do usuário contra esse alvo serão acertos críticos.
 */
export function isCritGuaranteed(attacker: Pokemon, defender: Pokemon): boolean {
    if (attacker.ability !== 'merciless') return false;
    
    return !!(defender.statusEffects.poison || defender.statusEffects.toxic);
}

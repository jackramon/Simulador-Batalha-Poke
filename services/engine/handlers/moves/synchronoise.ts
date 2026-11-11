
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Sincrorruído (Synchronoise).
 * Regra Oficial: Causa dano apenas se o usuário e o alvo compartilharem pelo menos um tipo.
 * Se não houver tipos em comum, o movimento falha (não causa dano).
 */
export function checkFailure(attacker: Pokemon, defender: Pokemon, logs: {message: string, color: string}[]): boolean {
    // Obtém os tipos efetivos (considerando Terastalização)
    const attackerTypes = attacker.isTerastallized && attacker.teraType 
        ? [attacker.teraType] 
        : attacker.types;

    const defenderTypes = defender.isTerastallized && defender.teraType 
        ? [defender.teraType] 
        : defender.types;

    // Verifica intersecção de tipos
    const hasSharedType = attackerTypes.some(t1 => defenderTypes.includes(t1));

    if (!hasSharedType) {
        log(logs, `Não afeta ${defender.name} porque não compartilham tipos!`, 'text-gray-500 italic');
        return true;
    }

    return false;
}

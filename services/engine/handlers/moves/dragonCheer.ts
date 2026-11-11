import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Handler para o movimento Dragon Cheer.
 * 
 * Efeito:
 * - Aumenta o ratio de acerto crítico do usuário e aliados em 1 estágio.
 * - Se o Pokémon for do tipo Dragão, aumenta em 2 estágios.
 * - Falha se o usuário já estiver sob efeito de Focus Energy ou Dragon Cheer.
 */
export function handleDragonCheer(attacker: Pokemon, logs: LogEntry[]) {
    if (attacker.statusEffects['dragon-cheer'] || attacker.statusEffects['focus-energy']) {
        log(logs, `Mas falhou! ${attacker.name} já está com a chance de crítico aumentada.`, 'text-gray-500 italic');
        return;
    }

    const isDragon = attacker.types.includes('dragon');
    // Usamos damageAccumulated para armazenar o bônus de estágio (1 ou 2)
    attacker.statusEffects['dragon-cheer'] = { 
        turns: -1, 
        damageAccumulated: isDragon ? 2 : 1 
    };
    
    if (isDragon) {
        log(logs, `${attacker.name} está animado pelo rugido do dragão! Sua chance de crítico aumentou muito!`, 'text-indigo-600 font-bold');
    } else {
        log(logs, `${attacker.name} está animado pelo rugido do dragão! Sua chance de crítico aumentou!`, 'text-indigo-600 font-bold');
    }
}

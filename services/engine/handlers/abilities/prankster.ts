
import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Travesso (Prankster).
 * 1. Aumenta a prioridade de movimentos de Status em +1.
 * 2. Pokémon do tipo Sombrio são imunes a movimentos de status de oponentes com Prankster (Regra Gen 7+).
 */

export function getPriorityBoost(pokemon: Pokemon, move: Move): number {
    if (pokemon.ability === 'prankster' && move.damageClass === 'status') {
        return 1;
    }
    return 0;
}

export function isDarkTypeImmuneToPrankster(attacker: Pokemon, defender: Pokemon, move: Move): boolean {
    if (attacker.ability !== 'prankster' || move.damageClass !== 'status') {
        return false;
    }
    
    // Regra Gen 7+: Tipos Sombrios são imunes a movimentos de status usados por Prankster
    return defender.types.includes('dark');
}

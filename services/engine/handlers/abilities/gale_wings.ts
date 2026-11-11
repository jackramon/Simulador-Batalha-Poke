
import { Pokemon, Move } from '../../../../types';

/**
 * Calcula o bônus de prioridade da habilidade Asas de Vendaval (Gale Wings).
 * Regra Gen 7+: Prioridade +1 para movimentos do tipo Voador se o HP estiver em 100%.
 */
export function getPriorityBoost(pokemon: Pokemon, move: Move): number {
    if (pokemon.ability === 'gale-wings' && pokemon.hp === pokemon.maxHP && move.type === 'flying') {
        return 1;
    }
    return 0;
}

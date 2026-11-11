
import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade Vale Ouro (Good as Gold).
 * Regra Oficial: O Pokémon é imune a movimentos da categoria Status usados por outros Pokémon.
 * Nota: Esta habilidade NÃO é ignorada por Mold Breaker, Teravolt ou Turboblaze.
 */
export function isImmuneToStatusMove(defender: Pokemon, move: Move): boolean {
    if (defender.ability !== 'good-as-gold' || defender.isFainted) {
        return false;
    }

    // A imunidade só se aplica a movimentos de categoria status (damageClass === 'status')
    return move.damageClass === 'status';
}

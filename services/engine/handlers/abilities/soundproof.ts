
import { Pokemon } from '../../../../types';
import { SOUND_MOVES } from '../../../../data/moves';

/**
 * Verifica se o movimento é baseado em som.
 */
export function isSoundMove(moveName: string): boolean {
    return SOUND_MOVES.includes(moveName);
}

/**
 * Lógica para a habilidade À Prova de Som (Soundproof).
 * Regra Oficial: O Pokémon é imune a movimentos baseados em som usados por outros Pokémon.
 * Esta habilidade é ignorada por Mold Breaker, Teravolt e Turboblaze.
 */
export function isImmune(defender: Pokemon, moveName: string, ignoresAbilities: boolean): boolean {
    if (defender.ability !== 'soundproof' || defender.isFainted || ignoresAbilities) {
        return false;
    }

    return isSoundMove(moveName);
}

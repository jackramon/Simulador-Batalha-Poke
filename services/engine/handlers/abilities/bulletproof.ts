
import { Pokemon, Move } from '../../../../types';
import { BALL_BOMB_MOVES } from '../../../../data/moves';

/**
 * Verifica se o movimento é classificado como uma "bola" ou "bomba" (projétil).
 */
export function isBallBombMove(moveName: string): boolean {
    return BALL_BOMB_MOVES.includes(moveName);
}

/**
 * Lógica para a habilidade À Prova de Balas (Bulletproof).
 * Torna o Pokémon imune a movimentos baseados em bolas e bombas.
 * Esta habilidade é ignorada por Mold Breaker, Teravolt e Turboblaze.
 */
export function isImmune(defender: Pokemon, move: Move, ignoresAbilities: boolean = false): boolean {
    if (defender.ability !== 'bulletproof' || defender.isFainted || ignoresAbilities) {
        return false;
    }

    return isBallBombMove(move.name);
}

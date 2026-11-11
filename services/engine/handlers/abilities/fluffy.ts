
import { Pokemon, Move } from '../../../../types';
import { isContactMove } from '../../../battleUtils';

/**
 * Lógica para a habilidade Felpudo (Fluffy).
 * Regra Oficial: 
 * 1. Reduz o dano de movimentos que fazem contato físico pela metade (0.5x).
 * 2. Dobra o dano recebido de movimentos do tipo Fogo (2.0x).
 * 3. Se um golpe for de contato e do tipo Fogo, o dano é normal (0.5 * 2 = 1).
 * Esta habilidade é ignorada por Mold Breaker, Teravolt e Turboblaze.
 */
export function getDamageMultiplier(defender: Pokemon, move: Move, ignoresAbilities: boolean): number {
    if (defender.ability !== 'fluffy' || defender.isFainted || ignoresAbilities) {
        return 1.0;
    }

    let multiplier = 1.0;

    // Reduz dano de golpes de contato
    if (isContactMove(move)) {
        multiplier *= 0.5;
    }

    // Dobra dano de golpes de fogo
    if (move.type === 'fire') {
        multiplier *= 2.0;
    }

    return multiplier;
}


import { Pokemon, Move } from '../../../../types';

/**
 * Calcula o multiplicador de poder para a habilidade Mandíbula de Dragão (Dragon's Maw).
 * Regra: Aumenta o poder de movimentos do tipo Dragão em 50% (1.5x).
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'dragon-maw' && move.type === 'dragon') {
        return 1.5;
    }
    return 1;
}


import { Pokemon, Move } from '../../../../types';
import { isContactMove } from '../../../battleUtils';

/**
 * Lógica para a habilidade Garras Duras (Tough Claws).
 * Regra Oficial: Aumenta o poder de movimentos que fazem contato físico em 30% (1.3x).
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'tough-claws' && isContactMove(move)) {
        return 1.3;
    }
    return 1.0;
}

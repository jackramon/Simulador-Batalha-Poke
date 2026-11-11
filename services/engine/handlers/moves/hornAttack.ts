
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Ataque de Chifre (Horn Attack).
 * Movimento físico do tipo Normal de 65BP sem efeitos secundários.
 */
export function handleHornAttack(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Horn Attack é um movimento de dano padrão.
    // Retorna o poder base sem modificadores específicos de movimento.
    return move.power;
}

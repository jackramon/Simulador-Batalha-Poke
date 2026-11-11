
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Espantar (Astonish).
 * Movimento físico do tipo Fantasma com 30 de poder base.
 * Efeito: Tem 30% de chance de fazer o alvo recuar (Flinch).
 * A chance de recuo é gerenciada pelo sistema de efeitos secundários (secondaryEffectRouter.ts).
 */
export function handleAstonish(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Retorna o poder base. A lógica de flinch reside no router genérico.
    return move.power;
}

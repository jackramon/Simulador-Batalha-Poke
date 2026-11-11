
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Hiper Raio (Hyper Beam).
 * Movimento especial do tipo Normal.
 * Poder Base: 150.
 * Efeito: O usuário deve recarregar no próximo turno.
 * O efeito de recarga é aplicado automaticamente pelo sistema de pipeline
 * através da categoria RECHARGE_MOVES em data/moves/categories.ts.
 */
export function handleHyperBeam(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    // Retorna o poder base padrão.
    // A flag attacker.mustRecharge = true é definida em preMoveValidation.ts
    return move.power;
}

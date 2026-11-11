
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Handler para o movimento Raio Eterno (Eternabeam).
 * 
 * Mecânica:
 * - Tipo: Dragão (Dragon)
 * - Categoria: Especial (Special)
 * - Poder: 160
 * - Precisão: 90%
 * - Efeito: O usuário deve recarregar no turno seguinte.
 * 
 * A lógica de recarga é tratada nativamente pelo sistema de batalha:
 * 1. O movimento é identificado como RECHARGE_MOVE em data/moves/categories.ts.
 * 2. O pipeline de movimento define attacker.mustRecharge = true.
 * 3. O sistema de validação impede ações no turno seguinte.
 */
export function handleEternabeam(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // A lógica de recarga é automática via RECHARGE_MOVES.
    // Este handler serve como ponto de extensão e documentação.
    return;
}

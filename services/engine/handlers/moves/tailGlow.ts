
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Brilho de Cauda (Tail Glow).
 * Regra Oficial: Aumenta o Ataque Especial do usuário em 3 estágios (Drasticamente).
 */
export function handleTailGlow(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Ataque Especial em 3 estágios
    // A magnitude (3) é tratada internamente em statChanges.ts ao detectar o nome 'tail-glow' na lista 'magnitudeTwoMoves' (ajustar para 3)
    StatChanges.applyMoveStatChange(
        attacker,
        'spAttack-up',
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'tail-glow',
        state
    );
}

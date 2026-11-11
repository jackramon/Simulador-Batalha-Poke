
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Endurecer (Harden).
 * Regra Oficial: Aumenta a Defesa do usuário em 1 estágio.
 */
export function handleHarden(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    // Aplica aumento de Defesa (+1) no usuário
    // isOpponentSource = false, pois é um efeito causado pelo próprio usuário (self-buff)
    StatChanges.applyMoveStatChange(
        attacker,
        'defense-up',
        logs,
        false, 
        false, // ignoresAbilities
        'harden',
        state
    );
}

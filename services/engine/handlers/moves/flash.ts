
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Flash.
 * Regra Oficial: Reduz a Precisão (Accuracy) do alvo em 1 estágio.
 */
export function handleFlash(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica redução de Precisão (-1)
    // isOpponentSource = true
    // ignoresAbilities = false (habilidades como Keen Eye, Clear Body previnem o efeito)
    StatChanges.applyMoveStatChange(
        defender,
        'accuracy-down',
        logs,
        true, 
        false, 
        'flash',
        state
    );
}

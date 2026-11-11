import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { applyMoveStatChange } from './statChanges';

/**
 * Lógica para o movimento Spin Out (Giro Desgovernado).
 * Causa dano e reduz a Velocidade do usuário em 2 estágios.
 */
export function handleSpinOutEffect(
    attacker: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    // Reduz a Velocidade em 2 estágios
    applyMoveStatChange(
        attacker, 
        'speed-down', 
        logs, 
        false, // isOpponentSource: False (Self-debuff)
        false, // ignoresAbilities
        'spin-out', // moveName (para magnitude 2)
        state
    );
}

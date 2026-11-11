
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Mente Calma (Calm Mind).
 * Regra Oficial: Aumenta o Ataque Especial e a Defesa Especial do usuário em 1 estágio cada.
 */
export function handleCalmMind(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Ataque Especial em 1 estágio
    StatChanges.applyMoveStatChange(
        attacker,
        'spAttack-up',
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'calm-mind',
        state
    );

    // Aumenta Defesa Especial em 1 estágio
    StatChanges.applyMoveStatChange(
        attacker,
        'spDefense-up',
        logs,
        false, // isOpponentSource
        false, // ignoresAbilities
        'calm-mind',
        state
    );
}


import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Trabalho Duro (Work Up).
 * Regra Oficial: Aumenta o Ataque e o Ataque Especial do usuário em 1 estágio.
 */
export function handleWorkUp(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Ataque em 1 estágio
    StatChanges.applyMoveStatChange(
        attacker,
        'attack-up',
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'work-up',
        state
    );

    // Aumenta Ataque Especial em 1 estágio
    StatChanges.applyMoveStatChange(
        attacker,
        'spAttack-up',
        logs,
        false, // isOpponentSource
        false, // ignoresAbilities
        'work-up',
        state
    );
}

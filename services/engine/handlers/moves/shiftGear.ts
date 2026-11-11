
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Engrenagem (Shift Gear).
 * Regra Oficial: Aumenta o Ataque do usuário em 1 estágio e a Velocidade em 2 estágios.
 */
export function handleShiftGear(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Ataque em 1 estágio
    // Passamos undefined como moveName para forçar magnitude 1 (já que 'shift-gear' estará mapeado para 2 no statChanges.ts)
    StatChanges.applyMoveStatChange(
        attacker,
        'attack-up',
        logs,
        false, // isOpponentSource
        false, // ignoresAbilities
        undefined, // moveName undefined para magnitude 1
        state
    );

    // Aumenta Velocidade em 2 estágios
    // Passamos 'shift-gear' como moveName, que deve estar na lista magnitudeTwoMoves em statChanges.ts
    StatChanges.applyMoveStatChange(
        attacker,
        'speed-up',
        logs,
        false, // isOpponentSource
        false, // ignoresAbilities
        'shift-gear',
        state
    );
}

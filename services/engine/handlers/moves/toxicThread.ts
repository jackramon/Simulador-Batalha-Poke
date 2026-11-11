
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as StatusConditions from '../effects/statusConditions';
import * as MoldBreaker from '../abilities/mold_breaker';

/**
 * Lógica para o movimento Fio Tóxico (Toxic Thread).
 * Regra Oficial: 
 * 1. Reduz a Velocidade do alvo em 1 estágio.
 * 2. Envenena (Poison) o alvo.
 * A precisão é 100.
 */
export function handleToxicThread(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    // 1. Reduz Velocidade (-1)
    // isOpponentSource = true
    StatChanges.applyMoveStatChange(
        defender,
        'speed-down',
        logs,
        true,
        ignoresAbilities,
        'toxic-thread',
        state
    );

    // 2. Aplica Veneno
    StatusConditions.applyStatus(
        defender,
        'poison',
        logs,
        attacker,
        false, // isFromSynchronize
        state
    );
}


import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as MoldBreaker from '../abilities/mold_breaker';

/**
 * Lógica para o movimento Cócegas (Tickle).
 * Regra Oficial: Reduz o Ataque e a Defesa do alvo em 1 estágio.
 */
export function handleTickle(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    // Aplica redução de Ataque (-1)
    StatChanges.applyMoveStatChange(
        defender,
        'attack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'tickle',
        state
    );

    // Aplica redução de Defesa (-1)
    StatChanges.applyMoveStatChange(
        defender,
        'defense-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'tickle',
        state
    );
}

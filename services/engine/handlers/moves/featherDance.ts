
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as MoldBreaker from '../abilities/mold_breaker';

/**
 * Lógica para o movimento Dança de Penas (Feather Dance).
 * Regra Oficial: Reduz o Ataque do alvo em 2 estágios (Drasticamente).
 */
export function handleFeatherDance(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    // Aplica redução de Ataque (-2)
    // A magnitude (2) é tratada internamente em statChanges.ts ao detectar o nome 'feather-dance'
    StatChanges.applyMoveStatChange(
        defender,
        'attack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'feather-dance',
        state
    );
}

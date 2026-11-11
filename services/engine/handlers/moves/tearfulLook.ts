
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Olhar Choroso (Tearful Look).
 * Regra Oficial: Reduz o Ataque e o Ataque Especial do alvo em 1 estágio.
 */
export function handleTearfulLook(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = ['mold-breaker', 'teravolt', 'turboblaze'].includes(attacker.ability);

    // Aplica redução de Ataque (-1)
    StatChanges.applyMoveStatChange(
        defender,
        'attack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'tearful-look',
        state
    );

    // Aplica redução de Ataque Especial (-1)
    StatChanges.applyMoveStatChange(
        defender,
        'spAttack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'tearful-look',
        state
    );
}

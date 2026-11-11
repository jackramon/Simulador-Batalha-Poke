
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Teimosia Inseto (Struggle Bug).
 * Regra Oficial: Reduz o Ataque Especial do alvo em 1 estágio (100% de chance).
 */
export function handleStruggleBugEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker)
    const ignoresAbilities = ['mold-breaker', 'teravolt', 'turboblaze'].includes(attacker.ability);

    // Aplica redução de Atq. Especial (-1)
    StatChanges.applyMoveStatChange(
        defender,
        'spAttack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'struggle-bug',
        state
    );
}

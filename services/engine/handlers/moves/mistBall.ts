
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o efeito secundário da Bola de Névoa (Mist Ball).
 * Regra Oficial: Tem 50% de chance de reduzir o Ataque Especial do alvo em 1 estágio.
 */
export function handleMistBallEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Mist)
    const ignoresAbilities = ['mold-breaker', 'teravolt', 'turboblaze'].includes(attacker.ability);

    // Aplica redução de Ataque Especial (-1)
    StatChanges.applyMoveStatChange(
        defender,
        'spAttack-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'mist-ball',
        state
    );
}

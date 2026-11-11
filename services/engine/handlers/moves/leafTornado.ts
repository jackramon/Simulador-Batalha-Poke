
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Tornado de Folhas (Leaf Tornado).
 * Regra Oficial: Causa dano e tem 50% de chance de reduzir a Precisão do alvo em 1 estágio.
 */
export function handleLeafTornadoEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Keen Eye)
    const ignoresAbilities = ['mold-breaker', 'teravolt', 'turboblaze'].includes(attacker.ability);

    // Aplica redução de Precisão (-1)
    StatChanges.applyMoveStatChange(
        defender,
        'accuracy-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities,
        'leaf-tornado',
        state
    );
}

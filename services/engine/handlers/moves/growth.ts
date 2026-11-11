
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from './statChanges';

/**
 * Lógica para o movimento Crescimento (Growth).
 * Regra Oficial: Aumenta o Ataque e o Ataque Especial do usuário em 1 estágio.
 * Se o clima for Sol Forte (Sun), aumenta em 2 estágios.
 */
export function handleGrowth(
    attacker: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (attacker.isFainted) return;

    // Aumenta Ataque
    // A magnitude (1 ou 2) é tratada internamente em statChanges.ts ao detectar o nome 'growth' e o clima
    StatChanges.applyMoveStatChange(
        attacker,
        'attack-up',
        logs,
        false, // isOpponentSource (False, é self-buff)
        false, // ignoresAbilities
        'growth',
        state
    );

    // Aumenta Ataque Especial
    StatChanges.applyMoveStatChange(
        attacker,
        'spAttack-up',
        logs,
        false, // isOpponentSource
        false, // ignoresAbilities
        'growth',
        state
    );
}

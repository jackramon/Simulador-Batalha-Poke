
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Brincadeira (Play Nice).
 * Regra Oficial: 
 * 1. Reduz o Ataque do alvo em 1 estágio.
 * 2. Ignora verificações de precisão e evasiva (Always Hit) - tratado em accuracy.ts.
 */
export function handlePlayNice(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica redução de Ataque (-1)
    // A magnitude é controlada em statChanges.ts verificando o nome do movimento
    // isOpponentSource = true
    StatChanges.applyMoveStatChange(
        defender,
        'attack-down',
        logs,
        true, 
        false, // ignoresAbilities
        'play-nice',
        state
    );
}

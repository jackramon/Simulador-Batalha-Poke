
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o movimento Ataque de Areia (Sand Attack).
 * Regra Oficial: Reduz a Precisão do alvo em 1 estágio.
 * Nota: Embora seja do tipo Terra, afeta Pokémon do tipo Voador e com Levitação 
 * (tratado em mechanics/effectiveness.ts).
 */
export function handleSandAttack(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState,
    ignoresAbilities: boolean = false
) {
    if (defender.isFainted) return;

    // Aplica redução de Precisão (-1)
    // O parâmetro 'isOpponentSource' é true.
    StatChanges.applyMoveStatChange(
        defender,
        'accuracy-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities, // Permite que Mold Breaker ignore habilidades como Keen Eye
        'sand-attack',
        state
    );
}


import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Adulação (Flatter).
 * Regra Oficial:
 * 1. Aumenta o Ataque Especial do alvo em 1 estágio.
 * 2. Confunde o alvo.
 * Os efeitos são independentes: se o alvo for imune à confusão, ainda ganha o boost, e vice-versa.
 */
export function handleFlatter(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // 1. Aumenta o Atq. Especial do alvo em 1 estágio
    // isOpponentSource = true (o atacante está causando isso no defensor)
    // O nome 'flatter' não está na lista de magnitude 2 em statChanges.ts, então padrão é 1
    StatChanges.applyMoveStatChange(
        defender,
        'spAttack-up',
        logs,
        true, 
        false, // ignoresAbilities
        'flatter',
        state
    );

    // 2. Aplica Confusão
    StatusConditions.applyStatus(
        defender,
        'confusion',
        logs,
        attacker,
        false,
        state
    );
}

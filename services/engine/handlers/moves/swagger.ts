
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Ostentação (Swagger).
 * Regra Oficial:
 * 1. Aumenta o Ataque do alvo em 2 estágios.
 * 2. Confunde o alvo.
 * Os efeitos são independentes: se o alvo for imune à confusão, ainda ganha o boost de ataque, e vice-versa.
 */
export function handleSwagger(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // 1. Aumenta o Ataque do alvo em 2 estágios
    // isOpponentSource = true (o atacante está causando isso no defensor)
    // O nome 'swagger' é registrado em statChanges.ts para ter magnitude 2
    StatChanges.applyMoveStatChange(
        defender,
        'attack-up',
        logs,
        true, 
        false, // ignoresAbilities
        'swagger',
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

import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Tempestade de Areia Escaldante (Sandsear Storm).
 * Tipo: Terrestre
 * Poder: 100
 * Precisão: 80
 * Efeito: 20% de chance de causar Queimadura (Burn).
 * Nota: Em Scarlet/Violet, NÃO ignora checagem de precisão na chuva (ao contrário de Legends: Arceus).
 */
export function handleSandsearStormEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica Queimadura
    StatusConditions.applyStatus(
        defender,
        'burn',
        logs,
        attacker,
        false, // isFromSynchronize
        state
    );
}

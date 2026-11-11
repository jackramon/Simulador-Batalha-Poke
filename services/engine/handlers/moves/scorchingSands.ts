
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Areias Escaldantes (Scorching Sands).
 * Regra Oficial: 
 * 1. Causa dano (processado no motor principal).
 * 2. Tem 30% de chance de causar Queimadura (Burn) no alvo.
 * 3. Descongela o usuário se estiver congelado (processado em moves.ts e preMoveValidation.ts).
 */
export function handleScorchingSandsEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
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

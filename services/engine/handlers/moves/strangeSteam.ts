
import { Pokemon, BattleState, Move } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Vapor Estranho (Strange Steam).
 * Tipo: Fada
 * Categoria: Especial
 * Poder: 90
 * Precisão: 95
 * Efeito: Tem 20% de chance de confundir o alvo.
 */

// Handler de Efeito Secundário
export function handleStrangeSteamEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica Confusão
    // StatusConditions.applyStatus lida com imunidades (Own Tempo, Misty Terrain, etc.)
    StatusConditions.applyStatus(
        defender,
        'confusion',
        logs as any,
        attacker,
        false, // isFromSynchronize
        state
    );
}

// Handler de Dano (Opcional, pois é padrão, mas mantido para consistência)
export function handleStrangeSteamDamage(attacker: Pokemon, defender: Pokemon, move: Move, state?: BattleState): number {
    return move.power;
}

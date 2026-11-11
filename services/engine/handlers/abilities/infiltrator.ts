
import { Pokemon, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Infiltrado (Infiltrator).
 * Regra Oficial: Golpes do usuário ignoram barreiras (Reflect, Light Screen, Safeguard, Mist, Aurora Veil)
 * e o Substituto do oponente.
 */

/**
 * Verifica se o atacante pode infiltrar barreiras no estado atual.
 */
export function canInfiltrate(attacker: Pokemon, state?: BattleState): boolean {
    if (attacker.ability !== 'infiltrator' || attacker.isFainted) {
        return false;
    }

    // Se houver um estado de batalha, verifica se o Gás Neutralizante está anulando a habilidade
    if (state && !NeutralizingGas.canAbilityTrigger(attacker, state)) {
        return false;
    }

    return true;
}

/**
 * Verifica se uma barreira específica deve ser ignorada pelo atacante.
 */
export function shouldIgnoreBarrier(attacker: Pokemon, state?: BattleState): boolean {
    return canInfiltrate(attacker, state);
}

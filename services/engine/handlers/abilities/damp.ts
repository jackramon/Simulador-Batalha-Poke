
import { BattleState, Pokemon } from '../../../../types';
import { EXPLOSIVE_MOVES } from '../../../../data/moves';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Umidade (Damp).
 * Regra Oficial: Impede o uso de movimentos explosivos (Self-Destruct, Explosion, etc.)
 * e a ativação da habilidade Aftermath enquanto um Pokémon com Damp estiver em campo.
 */

/**
 * Verifica se a habilidade Umidade está ativa em qualquer um dos lados do campo.
 */
export function isDampActive(state?: BattleState): boolean {
    if (!state) return false;

    const p1 = state.currentPokemon1;
    const p2 = state.currentPokemon2;

    const p1HasDamp = p1 && p1.ability === 'damp' && !p1.isFainted && NeutralizingGas.canAbilityTrigger(p1, state);
    const p2HasDamp = p2 && p2.ability === 'damp' && !p2.isFainted && NeutralizingGas.canAbilityTrigger(p2, state);

    return !!(p1HasDamp || p2HasDamp);
}

/**
 * Verifica se o movimento é do tipo explosivo.
 */
export function isExplosiveMove(moveName: string): boolean {
    return EXPLOSIVE_MOVES.includes(moveName);
}

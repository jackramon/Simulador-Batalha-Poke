
import { Move, Pokemon, BattleState } from '../../../../types';
import { DANCE_MOVES } from '../../../../data/moves';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Dançarino (Dancer).
 * Regra Oficial: Sempre que outro Pokémon usa um movimento de dança, 
 * o Pokémon com Dançarino usa o mesmo movimento imediatamente depois.
 */

/**
 * Verifica se um movimento pertence à categoria de dança.
 */
export function isDanceMove(move: Move): boolean {
    return DANCE_MOVES.includes(move.name);
}

/**
 * Verifica se a habilidade pode ser disparada.
 */
export function canTrigger(pokemon: Pokemon, state: BattleState): boolean {
    if (pokemon.ability !== 'dancer' || pokemon.isFainted) return false;
    
    // Respeita o Gás Neutralizante
    if (!NeutralizingGas.canAbilityTrigger(pokemon, state)) return false;

    return true;
}

import { Pokemon, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Lento (Stall).
 * Regra Oficial: O Pokémon com esta habilidade sempre move-se por último 
 * dentro de sua faixa de prioridade.
 */

export function isStallActive(pokemon: Pokemon, state: BattleState): boolean {
    if (pokemon.ability !== 'stall' || pokemon.isFainted) {
        return false;
    }

    // Verifica se a habilidade está suprimida pelo Gás Neutralizante
    if (!NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return false;
    }

    return true;
}

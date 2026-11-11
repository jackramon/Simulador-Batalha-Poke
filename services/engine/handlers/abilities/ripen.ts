
import { Pokemon, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Maturação (Ripen).
 * Regra Oficial: Dobra o efeito das frutas (berries) consumidas pelo Pokémon.
 */
export function getBerryMultiplier(pokemon: Pokemon, state?: BattleState): number {
    if (pokemon.ability === 'ripen' && NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return 2;
    }
    return 1;
}

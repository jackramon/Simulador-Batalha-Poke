import { Pokemon, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Fugitivo (Run Away).
 * Regra Oficial (Gen 9+): Permite que o Pokémon troque de lugar mesmo se estiver 
 * sob efeito de habilidades ou movimentos de aprisionamento.
 */
export function canBypassTrapping(pokemon: Pokemon, state?: BattleState): boolean {
    if (pokemon.ability !== 'run-away' || pokemon.isFainted) {
        return false;
    }

    // Verifica se a habilidade está suprimida (ex: Gás Neutralizante)
    if (state && !NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return false;
    }

    return true;
}

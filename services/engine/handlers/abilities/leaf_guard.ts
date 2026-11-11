import { Pokemon, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Guarda Folha (Leaf Guard).
 * Regra Oficial: Previne que o Pokémon sofra condições de status principais 
 * (paralisia, sono, envenenamento, queimadura e congelamento) durante Sol Forte.
 */
export function isImmuneToStatus(pokemon: Pokemon, weather: string, state?: BattleState): boolean {
    if (pokemon.ability !== 'leaf-guard' || pokemon.isFainted || weather !== 'sun') {
        return false;
    }

    // Verifica se a habilidade está suprimida (ex: Gás Neutralizante)
    if (state && !NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return false;
    }

    return true;
}

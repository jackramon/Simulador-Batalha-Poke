
import { Pokemon, BattleState } from '../../../../types';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Gula (Gluttony).
 * Regra Oficial: Faz com que o Pokémon coma frutas que normalmente seriam ativadas 
 * com 25% de HP ou menos (Pinch Berries) quando seu HP estiver em 50% ou menos.
 */

const PINCH_BERRIES = [
    'figy-berry', 'wiki-berry', 'mago-berry', 'aguav-berry', 'iapapa-berry',
    'liechi-berry', 'ganlon-berry', 'petaya-berry', 'apicot-berry', 'salac-berry',
    'lansat-berry', 'starf-berry', 'micle-berry', 'custap-berry'
];

/**
 * Retorna o limiar (threshold) de HP para ativação da fruta segurada.
 */
export function getActivationThreshold(pokemon: Pokemon, item: string, state?: BattleState): number {
    const hasGluttony = pokemon.ability === 'gluttony' && NeutralizingGas.canAbilityTrigger(pokemon, state);

    if (PINCH_BERRIES.includes(item)) {
        return hasGluttony ? 0.5 : 0.25;
    }

    // Fruta Sitrus sempre ativa com 50% nos jogos modernos
    if (item === 'sitrus-berry') {
        return 0.5;
    }

    return 0;
}

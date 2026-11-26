import { Pokemon, BattleState } from '../../../../types';
import { BattlePRNG, nextBattleRandom } from '../../../../utils/prng';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Coleta de Mel (Honey Gather).
 * Regra Adaptada para Duelo: No final de cada turno, se o Pokémon não estiver segurando nada,
 * ele tem 50% de chance de coletar um Mel.
 */
export function handleHoneyGather(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[], prng?: BattlePRNG): boolean {
    // Requisitos: Ter a habilidade, estar vivo e não estar segurando item
    if (pokemon.ability !== 'honey-gather' || pokemon.isFainted || pokemon.heldItem) {
        return false;
    }

    // Respeita o Gás Neutralizante
    if (!NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return false;
    }

    // 50% de chance de coletar
    if (nextBattleRandom(state, prng) < 0.5) {
        pokemon.heldItem = 'honey';
        log(logs, `${pokemon.name} coletou um pouco de Mel com sua habilidade!`, 'text-yellow-600 font-bold italic');
        return true;
    }

    return false;
}
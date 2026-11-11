
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Impassível (Steadfast).
 * Regra Oficial: Aumenta a Velocidade do Pokémon em 1 estágio toda vez que ele recua (flinch).
 */
export function triggerSteadfast(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]): boolean {
    if (pokemon.ability !== 'steadfast' || pokemon.isFainted) {
        return false;
    }

    // Respeita o Gás Neutralizante
    if (!NeutralizingGas.canAbilityTrigger(pokemon, state)) {
        return false;
    }

    if (pokemon.statStages.speed < 6) {
        pokemon.statStages.speed++;
        log(logs, `A habilidade Impassível de ${pokemon.name} aumentou sua Velocidade ao recuar!`, 'text-indigo-600 font-bold');
        return true;
    }

    return false;
}

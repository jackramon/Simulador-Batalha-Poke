import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Teraformação Zero (Teraform Zero).
 * Regra Oficial: Quando Terapagos entra em batalha, os efeitos de clima e terreno desaparecem.
 */
export function handleTeraformZero(
    pokemon: Pokemon,
    state: BattleState,
    logs: {message: string, color: string}[]
) {
    if (pokemon.ability !== 'teraform-zero') return;

    let changed = false;

    if (state.weather && state.weather !== 'none') {
        state.weather = 'none';
        state.weatherTurns = 0;
        changed = true;
    }

    if (state.terrain && state.terrain !== 'none') {
        state.terrain = 'none';
        state.terrainTurns = 0;
        changed = true;
    }

    if (changed) {
        log(logs, `A Teraformação Zero de ${pokemon.name} neutralizou o clima e o terreno!`, 'text-blue-600 font-bold');
    }
}

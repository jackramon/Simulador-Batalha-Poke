
import { Pokemon, BattleState } from '../../../../types';
import { getPokemonPlayerNum } from '../../../../utils/pokemonIdentity';
import { log } from '../../utils';

export function handleSpikes(
    attacker: Pokemon, 
    logs: {message: string, color: string}[], 
    state: BattleState
) {
    const isP1 = getPokemonPlayerNum(state, attacker) === 1;
    const targetHazards = isP1 ? state.p2Hazards : state.p1Hazards;

    if (targetHazards.spikes >= 3) {
        log(logs, `Mas falhou! O campo já está cheio de espinhos.`, 'text-gray-500 italic');
    } else {
        targetHazards.spikes++;
        log(logs, `Espinhos foram espalhados no chão do time adversário!`, 'text-gray-700 font-bold');
    }
}

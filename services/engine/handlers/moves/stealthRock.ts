
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

export function handleStealthRock(
    attacker: Pokemon, 
    logs: {message: string, color: string}[], 
    state: BattleState
) {
    // Identifica o lado do oponente
    // Se o atacante é P1, aplica em p2Hazards
    const isP1 = state.currentPokemon1?.id === attacker.id;
    const targetHazards = isP1 ? state.p2Hazards : state.p1Hazards;

    if (targetHazards.stealthRock) {
        log(logs, `Mas falhou! Pedras já estão espalhadas.`, 'text-gray-500 italic');
    } else {
        targetHazards.stealthRock = true;
        log(logs, `Pedras pontiagudas flutuam no ar ao redor do time adversário!`, 'text-gray-700 font-bold');
    }
}

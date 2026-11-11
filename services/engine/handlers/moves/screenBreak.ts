
import { BattleState, Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

export function handleScreenBreak(
    state: BattleState,
    defender: Pokemon,
    logs: {message: string, color: string}[]
) {
    if (!state) return;

    // Identifica o lado do defensor para remover suas barreiras
    const isP1 = state.currentPokemon1?.id === defender.id;
    const hazards = isP1 ? state.p1Hazards : state.p2Hazards;
    let broken = false;

    if (hazards.reflect > 0 || hazards.lightScreen > 0 || hazards.auroraVeil > 0) {
        hazards.reflect = 0;
        hazards.lightScreen = 0;
        hazards.auroraVeil = 0;
        broken = true;
    }

    if (broken) {
        log(logs, BATTLE_MESSAGES.SCREENS_BROKEN(defender.name), 'text-orange-600 font-bold');
    }
}

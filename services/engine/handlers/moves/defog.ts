
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as StatChanges from '../effects/statChanges';
import * as Hazards from '../hazards';
import * as SteelRoller from './steelRoller';
import * as MoldBreaker from '../abilities/mold_breaker';

export function handleDefog(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (!state) return;

    // 1. Reduz Evasiva do alvo
    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    StatChanges.applyMoveStatChange(
        defender,
        'evasion-down',
        logs,
        true, // isOpponentSource
        ignoresAbilities, 
        'defog',
        state
    );

    // 2. Limpa Hazards de ambos os lados
    Hazards.clearEntryHazards(state.p1Hazards);
    Hazards.clearEntryHazards(state.p2Hazards);

    // 3. Remove Screens do lado do ALVO (Target's side)
    const isP1 = state.currentPokemon1?.id === attacker.id;
    const targetHazards = isP1 ? state.p2Hazards : state.p1Hazards;
    
    Hazards.clearScreens(targetHazards);

    // 4. Remove Terreno
    if (state.terrain !== 'none') {
        SteelRoller.handleTerrainRemoval(state, logs);
    }

    log(logs, "O vento forte limpou os perigos de entrada e barreiras!", 'text-blue-600 font-bold');
}


import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

export function handleTailwind(
    attacker: Pokemon, 
    logs: {message: string, color: string}[], 
    state: BattleState
) {
    const isP1 = state.currentPokemon1?.id === attacker.id;
    // Tailwind afeta o lado do USUÁRIO
    const myHazards = isP1 ? state.p1Hazards : state.p2Hazards;

    if (myHazards.tailwind > 0) {
        log(logs, `Mas falhou! O vento de cauda já está soprando.`, 'text-gray-500 italic');
    } else {
        myHazards.tailwind = 4;
        log(logs, `Um vento de cauda soprou atrás do time de ${attacker.name}!`, 'text-blue-500 font-bold');
    }
}

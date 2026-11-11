
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Teia Pegajosa (Sticky Web).
 * Efeito: Coloca uma teia no campo do oponente que reduz a Velocidade 
 * de Pokémon aterrados (grounded) que entrarem em batalha.
 */
export function handleStickyWeb(
    attacker: Pokemon, 
    logs: {message: string, color: string}[], 
    state: BattleState
) {
    // Identifica o lado do oponente
    const isP1 = state.currentPokemon1?.id === attacker.id;
    const targetHazards = isP1 ? state.p2Hazards : state.p1Hazards;

    if (targetHazards.stickyWeb) {
        log(logs, `Mas falhou! Uma teia já cobre o campo adversário.`, 'text-gray-500 italic');
    } else {
        targetHazards.stickyWeb = true;
        log(logs, `Uma teia pegajosa foi tecida ao redor do time adversário!`, 'text-purple-600 font-bold');
    }
}

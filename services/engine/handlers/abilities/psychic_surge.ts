
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Terreno Psíquico (Psychic Surge).
 * Ao entrar em batalha, cria um Campo Psíquico que dura 5 turnos (ou 8 com Terrain Extender).
 */
export function handlePsychicSurge(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'psychic-surge' || pokemon.isFainted) return;

    // Ativa o terreno
    state.terrain = 'psychic';
    
    // Verifica item Extensor de Terreno
    state.terrainTurns = pokemon.heldItem === 'terrain-extender' ? 8 : 5;
    
    log(logs, `Uma energia estranha envolveu o campo com o Terreno Psíquico de ${pokemon.name}!`, 'text-purple-600 font-bold italic');
}

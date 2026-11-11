
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Terreno de Grama (Grassy Surge).
 * Ao entrar em batalha, invoca o Terreno de Grama.
 */
export function handleGrassySurge(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'grassy-surge' || pokemon.isFainted) return;

    state.terrain = 'grassy';
    
    // Suporte ao item Extensor de Terreno (Terrain Extender)
    state.terrainTurns = pokemon.heldItem === 'terrain-extender' ? 8 : 5;
    
    log(logs, `A grama alta brotou por todo o campo com o Terreno de Grama de ${pokemon.name}!`, 'text-green-600 font-bold italic');
}

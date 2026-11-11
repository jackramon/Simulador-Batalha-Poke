import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Névoa de Gênese (Misty Surge).
 * Regra Oficial: Ao entrar em batalha, invoca o Campo de Névoa (Misty Terrain).
 * O terreno dura 5 turnos, ou 8 turnos se o usuário estiver segurando um Extensor de Terreno.
 */
export function handleMistySurge(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]) {
    if (pokemon.ability !== 'misty-surge' || pokemon.isFainted) return;

    // Ativa ou renova o terreno
    state.terrain = 'misty';
    
    // Suporte ao item Extensor de Terreno (Terrain Extender)
    state.terrainTurns = pokemon.heldItem === 'terrain-extender' ? 8 : 5;
    
    log(logs, `A névoa de ${pokemon.name} envolveu o campo com o Campo de Névoa!`, 'text-pink-500 font-bold italic');
}

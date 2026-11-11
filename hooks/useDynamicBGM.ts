
import { useEffect } from 'react';
import { BattleState } from '../types';
import AudioManager from '../services/audio/AudioManager';
import { 
    BGM_BATTLE_NORMAL, 
    BGM_BATTLE_CRITICAL, 
    BGM_VICTORY, 
    BGM_WEATHER_SUN, 
    BGM_WEATHER_RAIN, 
    BGM_WEATHER_SAND, 
    BGM_WEATHER_HAIL,
    BGM_LAST_POKEMON 
} from '../data/audioTracks';

export const useDynamicBGM = (state: BattleState) => {
    useEffect(() => {
        // 0. Verifica se o jogador está na tela de troca forçada (Seu Pokémon desmaiou)
        // Se sim, MANTÉM a música atual (não troca para "Last Pokemon" prematuramente ou reseta).
        // Isso evita cortes bruscos enquanto o jogador decide quem enviar.
        if (state.currentPokemon1?.isFainted && !state.winner) {
            return;
        }

        // Se não houver batalha e não houver vencedor (ex: tela de setup inicial ou reset), parar música
        if (!state.isBattleInProgress && !state.winner) {
            AudioManager.stopMusic();
            return;
        }

        let track = BGM_BATTLE_NORMAL;

        // 1. Prioridade Máxima: Vitória
        if (state.winner) {
            track = BGM_VICTORY;
        } 
        else {
            // Verifica status dos times
            const p1Alive = state.team1.filter(p => !p.isFainted).length;
            const p2Alive = state.team2.filter(p => !p.isFainted).length;
            const p1Active = state.currentPokemon1;
            
            // 2. Último Pokémon (Tensão Máxima)
            if (p1Alive === 1 || p2Alive === 1) {
                track = BGM_LAST_POKEMON;
            }
            // 3. HP Crítico (Se ainda não for Last Pokemon, mas o ativo estiver morrendo)
            else if (p1Active && (p1Active.hp / p1Active.maxHP) <= 0.2) {
                track = BGM_BATTLE_CRITICAL;
            }
            // 4. Clima (Se nada mais urgente estiver acontecendo)
            else if (state.weather !== 'none') {
                switch (state.weather) {
                    case 'sun': track = BGM_WEATHER_SUN; break;
                    case 'rain': track = BGM_WEATHER_RAIN; break;
                    case 'sand': track = BGM_WEATHER_SAND; break;
                    case 'hail': track = BGM_WEATHER_HAIL; break;
                    default: track = BGM_BATTLE_NORMAL;
                }
            }
        }

        AudioManager.playMusic(track);

    }, [
        state.isBattleInProgress,
        state.winner,
        state.weather,
        state.currentPokemon1?.hp, // Reage a dano
        state.currentPokemon1?.id, // Reage a trocas
        // Rastreia contagem de vivos para ativar Last Pokemon music
        state.team1.filter(p => !p.isFainted).length,
        state.team2.filter(p => !p.isFainted).length,
        // Adicionado isFainted para disparar efeito quando o pokemon volta (revive ou troca)
        state.currentPokemon1?.isFainted 
    ]);
};


import { Pokemon, BattleState, BattleConfig, LogEntry, SideHazards } from '../../types';
import { WEATHER_DATA, TERRAIN_DATA } from '../../data/general';
import { BATTLE_MESSAGES } from '../../data/battleMessages';
import * as Effects from '../effectHandlers';
import { log } from './utils';
import * as Forecast from './handlers/abilities/forecast';

function processSideHazards(hazards: SideHazards, logs: LogEntry[], sideName: string) {
    // Decrementa Reflect
    if (hazards.reflect > 0) {
        hazards.reflect--;
        if (hazards.reflect === 0) {
            log(logs, `O efeito de Refletir do ${sideName} desapareceu.`, 'text-gray-500 italic');
        }
    }

    // Decrementa Light Screen
    if (hazards.lightScreen > 0) {
        hazards.lightScreen--;
        if (hazards.lightScreen === 0) {
            log(logs, `O efeito de Tela de Luz do ${sideName} desapareceu.`, 'text-gray-500 italic');
        }
    }

    // Decrementa Aurora Veil
    if (hazards.auroraVeil > 0) {
        hazards.auroraVeil--;
        if (hazards.auroraVeil === 0) {
            log(logs, `O Véu Aurora do ${sideName} desapareceu.`, 'text-gray-500 italic');
        }
    }

    // Decrementa Safeguard
    if (hazards.safeguard > 0) {
        hazards.safeguard--;
        if (hazards.safeguard === 0) {
            log(logs, `O time do ${sideName} não está mais protegido pela Salvaguarda.`, 'text-gray-500 italic');
        }
    }

    // Decrementa Mist
    if (hazards.mist > 0) {
        hazards.mist--;
        if (hazards.mist === 0) {
            log(logs, `A névoa do ${sideName} desapareceu.`, 'text-gray-500 italic');
        }
    }

    // Decrementa Tailwind
    if (hazards.tailwind > 0) {
        hazards.tailwind--;
        if (hazards.tailwind === 0) {
            log(logs, `O vento de cauda do ${sideName} cessou!`, 'text-orange-500 font-bold italic');
        }
    }
}

export function processTurnEnd(currentState: BattleState, config: BattleConfig): { newState: BattleState, logs: LogEntry[] } {
  const logs: LogEntry[] = [];
  const state = { ...currentState };

  // Processa contadores de Efeitos de Lado (Hazards/Screens/Tailwind)
  processSideHazards(state.p1Hazards, logs, 'Jogador');
  processSideHazards(state.p2Hazards, logs, 'Oponente');

  // Decrementa Esporte de Lama (Mud Sport)
  if (state.mudSportTurns > 0) {
      state.mudSportTurns--;
      if (state.mudSportTurns <= 0) {
          log(logs, `Os efeitos de Esporte de Lama desapareceram.`, 'text-gray-500 italic');
      }
  }

  // Gerenciamento de Clima
  if (config.weatherEnabled) {
    if (state.weather !== 'none') {
        // Clima Ativo: Decrementa e verifica expiração
        state.weatherTurns--;
        
        if (state.weatherTurns <= 0) {
            const oldWeather = state.weather;
            
            // Dissipa o clima atual
            state.weather = 'none';
            state.weatherTurns = 0;
            log(logs, `O clima ${WEATHER_DATA[oldWeather].name} se dissipou.`, 'text-gray-500 italic');

            // Atualiza Forecast para forma normal imediatamente
            if (state.currentPokemon1) Forecast.handleForecast(state.currentPokemon1, state, logs);
            if (state.currentPokemon2) Forecast.handleForecast(state.currentPokemon2, state, logs);

            // Chance de Rebote Climático (30%): Um novo clima começa imediatamente após o fim do anterior
            if (Math.random() < 0.3) {
                const weathers = ['sun', 'rain', 'sand', 'hail'] as const;
                const nextWeather = weathers[Math.floor(Math.random() * weathers.length)];
                
                state.weather = nextWeather;
                state.weatherTurns = 5;
                log(logs, `Mas os ventos mudaram rapidamente! Agora faz ${WEATHER_DATA[state.weather].name}!`, 'text-blue-600 font-bold');

                // Atualiza Forecast para o novo clima
                if (state.currentPokemon1) Forecast.handleForecast(state.currentPokemon1, state, logs);
                if (state.currentPokemon2) Forecast.handleForecast(state.currentPokemon2, state, logs);
            }
        }
    } else {
        // Sem Clima: Chance de Clima Espontâneo (20%)
        if (Math.random() < 0.2) {
            const weathers = ['sun', 'rain', 'sand', 'hail'] as const;
            const nextWeather = weathers[Math.floor(Math.random() * weathers.length)];
            
            state.weather = nextWeather;
            state.weatherTurns = 5;
            log(logs, `De repente, o clima mudou para ${WEATHER_DATA[state.weather].name}!`, 'text-blue-600 font-bold');

            if (state.currentPokemon1) Forecast.handleForecast(state.currentPokemon1, state, logs);
            if (state.currentPokemon2) Forecast.handleForecast(state.currentPokemon2, state, logs);
        }
    }
  } else {
    // Se weatherEnabled for false, garante que o clima seja limpo
    state.weather = 'none';
    state.weatherTurns = 0;
  }

  // Gerenciamento de Terreno
  if (config.terrainEnabled) {
      const terrains = ['electric', 'grassy', 'misty', 'psychic'] as const;
      
      const getTerrainMsg = (type: typeof terrains[number], isNew: boolean) => {
          if (!isNew) {
              if (type === 'electric') return "A eletricidade no campo tornou-se ainda mais intensa!";
              if (type === 'grassy') return "O terreno de grama tornou-se ainda mais verde e vivo!";
              if (type === 'misty') return "A névoa mística tornou-se mais densa ao redor!";
              if (type === 'psychic') return "A energia mística no campo se fortaleceu!";
              return "";
          }
          if (type === 'electric') return "O campo tornou-se subitamente eletrizante!";
          if (type === 'grassy') return "Grama alta começou a brotar por todo o campo!";
          if (type === 'misty') return "Uma névoa mística envolveu o campo de batalha!";
          if (type === 'psychic') return "Uma estranha energia mística envolveu a área!";
          return "";
      };

      const getTerrainColor = (type: typeof terrains[number]) => {
          if (type === 'electric') return "text-yellow-500";
          if (type === 'grassy') return "text-green-500";
          if (type === 'misty') return "text-pink-500";
          if (type === 'psychic') return "text-purple-600";
          return "text-gray-500";
      };

      if (state.terrain !== 'none') {
          state.terrainTurns--;
          
          if (state.terrainTurns <= 0) {
              const oldTerrain = state.terrain as typeof terrains[number];
              const roll = Math.random();

              if (roll < 0.3) {
                  log(logs, `A energia do ${TERRAIN_DATA[oldTerrain].name} dissipou-se naturalmente.`, 'text-gray-500 italic');
                  state.terrain = 'none';
                  state.terrainTurns = 0;
              } else {
                  const nextTerrain = terrains[Math.floor(Math.random() * terrains.length)];
                  const isIntensifying = nextTerrain === oldTerrain;
                  state.terrain = nextTerrain;
                  state.terrainTurns = 5;
                  log(logs, getTerrainMsg(nextTerrain, !isIntensifying), getTerrainColor(nextTerrain) + " font-bold italic");
              }
          }
      } else {
          if (Math.random() < 0.15) {
              const nextTerrain = terrains[Math.floor(Math.random() * terrains.length)];
              state.terrain = nextTerrain;
              state.terrainTurns = 5;
              log(logs, getTerrainMsg(nextTerrain, true), getTerrainColor(nextTerrain) + " font-bold italic");
          }
      }
  } else {
      state.terrain = 'none';
      state.terrainTurns = 0;
  }

  if (state.trickRoomActive) {
    state.trickRoomTurns--;
    if (state.trickRoomTurns <= 0) {
      state.trickRoomActive = false;
      log(logs, BATTLE_MESSAGES.TRICK_ROOM_END(), 'text-purple-600 font-bold');
    }
  }

  // Reset Ion Deluge
  if (state.ionDelugeActive) {
      state.ionDelugeActive = false;
      log(logs, 'A chuva de íons dissipou-se.', 'text-gray-500 italic');
  }

  const allActive = [state.currentPokemon1, state.currentPokemon2];
  
  allActive.forEach(p => {
    if (p) {
        // Limpeza de rastreadores temporários de fim de turno
        delete p.statusEffects['avalanche-tracker'];
        delete p.statusEffects['physical-damage-taken'];
        delete p.statusEffects['special-damage-taken'];
        
        if (!p.isFainted) p.turnsActive++;
    }
  });

  Effects.processTurnEndEffects(allActive, state.weather, config.weatherEnabled, logs, state);

  state.turn++;

  return { newState: state, logs };
}
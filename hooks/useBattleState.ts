
import { useState, useEffect, useRef } from 'react';
import { BattleState, BattleConfig, Pokemon, PlayerInventory, BattleReplay, BattleReplayEvent } from '../types';
import { fetchTeam, clearApiCache, fetchRawPokemonData } from '../services/api';
import { ITEMS_DATA, POKEMON_TO_MEGA_STONES, MEGA_STONES } from '../data/items';
import * as Effects from '../services/effectHandlers';
import { enableDeterministicRandom, disableDeterministicRandom } from '../utils/prng';

const KEY_BATTLE_STATE = 'poke_sim_battle_state';
const KEY_BATTLE_CONFIG = 'poke_sim_battle_config';
const KEY_P1_CUSTOM_TEAM = 'poke_sim_p1_team';
const KEY_P2_CUSTOM_TEAM = 'poke_sim_p2_team';

export const useBattleState = () => {
  const [config, setConfig] = useState<BattleConfig>({
    p1Mode: 'random', 
    p1TeamSize: 6, 
    p1Input: '',
    p2Mode: 'random', 
    p2TeamSize: 6, 
    p2Input: '',
    opponentMode: 'auto', 
    weatherEnabled: true, 
    terrainEnabled: true, 
    itemsEnabled: true, 
    terastallizationEnabled: true, 
    megaEvolutionEnabled: true,
    moveLimitEnabled: true,
    p1AutoMode: false,
    useLLM: false,
    llmProvider: 'gemini',
    llmModel: 'gemini-2.5-flash',
    randomIvs: true,
    randomLevels: false 
  });

  const [state, setState] = useState<BattleState>({
    team1: [], team2: [], currentPokemon1: null, currentPokemon2: null,
    p1Inventory: { items: [] }, 
    p2Inventory: { items: [] },
    p1TeraUsed: false,
    p2TeraUsed: false,
    p1MegaUsed: false,
    p2MegaUsed: false,
    turn: 1, weather: 'none', weatherTurns: 0, 
    terrain: 'none', terrainTurns: 0,
    gravity: false, gravityTurns: 0, 
    mudSportTurns: 0, 
    waterSportTurns: 0,
    ionDelugeActive: false,
    wonderRoomActive: false, wonderRoomTurns: 0,
    magicRoomActive: false, magicRoomTurns: 0,
    trickRoomActive: false, trickRoomTurns: 0,
    p1Hazards: { toxicSpikes: 0, reflect: 0, lightScreen: 0, safeguard: 0, mist: 0, luckyChant: 0, auroraVeil: 0, stealthRock: false, stickyWeb: false, spikes: 0, tailwind: 0 }, 
    p2Hazards: { toxicSpikes: 0, reflect: 0, lightScreen: 0, safeguard: 0, mist: 0, luckyChant: 0, auroraVeil: 0, stealthRock: false, stickyWeb: false, spikes: 0, tailwind: 0 },
    logs: [], isBattleInProgress: false, winner: null, waitingForAction: false
  });

  const [isLoading, setIsLoading] = useState(false);
  
  const p1CustomTeamRef = useRef<Pokemon[] | null>(null);
  const p2CustomTeamRef = useRef<Pokemon[] | null>(null);
  const stateRef = useRef(state);
  const configRef = useRef(config);
  
  const fetchingIds = useRef<Set<number>>(new Set()); 

  // Sincroniza refs
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { configRef.current = config; }, [config]);

  // --- PERSISTÊNCIA: Hidratação na Montagem ---
  useEffect(() => {
      const loadData = () => {
          try {
              const savedConfig = localStorage.getItem(KEY_BATTLE_CONFIG);
              if (savedConfig) {
                  setConfig(JSON.parse(savedConfig));
              }

              const savedP1Team = localStorage.getItem(KEY_P1_CUSTOM_TEAM);
              if (savedP1Team) p1CustomTeamRef.current = JSON.parse(savedP1Team);

              const savedP2Team = localStorage.getItem(KEY_P2_CUSTOM_TEAM);
              if (savedP2Team) p2CustomTeamRef.current = JSON.parse(savedP2Team);

              const savedState = localStorage.getItem(KEY_BATTLE_STATE);
              if (savedState) {
                  const parsedState = JSON.parse(savedState);
                  if (parsedState.isBattleInProgress || parsedState.winner) {
                      // Garante que novos campos existam no estado recuperado
                      if (parsedState.mudSportTurns === undefined) parsedState.mudSportTurns = 0;
                      if (parsedState.waterSportTurns === undefined) parsedState.waterSportTurns = 0;
                      if (parsedState.gravity === undefined) parsedState.gravity = false;
                      if (parsedState.gravityTurns === undefined) parsedState.gravityTurns = 0;
                      if (parsedState.wonderRoomActive === undefined) parsedState.wonderRoomActive = false;
                      if (parsedState.wonderRoomTurns === undefined) parsedState.wonderRoomTurns = 0;
                      if (parsedState.magicRoomActive === undefined) parsedState.magicRoomActive = false;
                      if (parsedState.magicRoomTurns === undefined) parsedState.magicRoomTurns = 0;
                      if (parsedState.p1Hazards && parsedState.p1Hazards.luckyChant === undefined) parsedState.p1Hazards.luckyChant = 0;
                      if (parsedState.p2Hazards && parsedState.p2Hazards.luckyChant === undefined) parsedState.p2Hazards.luckyChant = 0;
                      
                      // FIX: Force waitingForAction to false to prevent "stuck" state if app crashed during processing
                      parsedState.waitingForAction = false;

                      setState(parsedState);
                      window.dispatchEvent(new CustomEvent('show-toast', { detail: "🔄 Batalha anterior restaurada!" }));
                  }
              }
          } catch (error) {
              console.error("Erro ao carregar dados salvos:", error);
              localStorage.removeItem(KEY_BATTLE_STATE);
          }
      };
      loadData();
  }, []);

  // --- PERSISTÊNCIA: Salvar Estado ---
  useEffect(() => {
      const saveBattleState = () => {
          try {
              if (state.isBattleInProgress || state.winner) {
                  localStorage.setItem(KEY_BATTLE_STATE, JSON.stringify(state));
              }
          } catch (e: any) {
              if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                  console.warn("Espaço insuficiente. Tentando limpar cache...");
                  try {
                      clearApiCache(); 
                      if (state.isBattleInProgress || state.winner) {
                          localStorage.setItem(KEY_BATTLE_STATE, JSON.stringify(state));
                      }
                  } catch (retryError) {}
              }
          }
      };
      saveBattleState();
  }, [state]);

  // --- PERSISTÊNCIA: Salvar Config ---
  useEffect(() => { 
      try {
          localStorage.setItem(KEY_BATTLE_CONFIG, JSON.stringify(config));
      } catch (e) {}
  }, [config]);

  // --- DETECÇÃO DE MUDANÇAS POR VALOR (Assinaturas) ---
  const heldItemsSignature = [...state.team1, ...state.team2]
      .map(p => `${p.id}:${p.heldItem || 'null'}`)
      .join('|');

  const activeIdsSignature = `${state.currentPokemon1?.id || 'null'}|${state.currentPokemon2?.id || 'null'}`;

  const [currentReplay, setCurrentReplay] = useState<BattleReplay | null>(null);

  // --- HIDRATAÇÃO SECUNDÁRIA (BACKGROUND) ---
  // Apenas busca dados se faltarem. A lógica síncrona na UI e no Engine lida com a falta de dados.
  useEffect(() => {
      const allPokemon = [...state.team1, ...state.team2];

      allPokemon.forEach(p => {
          const stoneSuffix = p.heldItem ? MEGA_STONES[p.heldItem] : null;
          const isTransformed = p.statusEffects?.['transformed'] || p.statusEffects?.['imposter'];
          const alreadyMega = p.isMega;

          // Se tem pedra, não é mega, não está transformado e NÃO tem perfil, busca em background
          if (stoneSuffix && !p.megaProfile && !alreadyMega && !isTransformed) {
              if (!fetchingIds.current.has(p.id)) {
                  fetchingIds.current.add(p.id);
                  
                  // Normalização do nome para API
                  // FIX AGRESSIVO: Remover sufixos de gênero antes e depois de normalizar
                  let baseName = (p.speciesId || p.name).toLowerCase().trim();
                  
                  // Remove símbolos de gênero
                  baseName = baseName.replace(/♀/g, '').replace(/♂/g, '');
                  
                  // Remove sufixos explícitos antes de substituir espaços (caso já venha como 'gyarados-m')
                  baseName = baseName.replace(/-m$/, '').replace(/-f$/, '');
                  
                  // Substitui espaços e caracteres especiais por hífens
                  baseName = baseName.replace(/[ .']/g, '-');
                  
                  // Remove sufixos de gênero textuais que podem ter sido gerados
                  baseName = baseName.replace(/-male$/, '').replace(/-female$/, '');
                  
                  // Limpeza final de hífens
                  baseName = baseName.replace(/-+/g, '-').replace(/-$/, '');
                  
                  const megaApiName = `${baseName}${stoneSuffix}`;

                  fetchRawPokemonData(megaApiName)
                      .then(megaData => {
                          const getStat = (name: string) => megaData.stats.find((s: any) => s.stat.name === name)?.base_stat || 50;
                          
                          let megaSpriteUrl = megaData.sprites.other?.['official-artwork']?.front_default || megaData.sprites.front_default;
                          let megaBackSpriteUrl = megaData.sprites.back_default || megaData.sprites.front_default;
                          let megaPixelSpriteUrl = megaData.sprites.front_default;

                          if (p.isShiny) {
                              if (megaData.sprites.other?.['official-artwork']?.front_shiny) {
                                  megaSpriteUrl = megaData.sprites.other['official-artwork'].front_shiny;
                              }
                              if (megaData.sprites.back_shiny) megaBackSpriteUrl = megaData.sprites.back_shiny;
                              if (megaData.sprites.front_shiny) megaPixelSpriteUrl = megaData.sprites.front_shiny;
                          }
                          
                          let megaNameDisplay = `Mega ${p.name}`;
                          if (stoneSuffix === '-mega-x') megaNameDisplay += ' X';
                          if (stoneSuffix === '-mega-y') megaNameDisplay += ' Y';

                          const realMegaProfile = {
                              name: megaNameDisplay,
                              stats: {
                                  hp: getStat('hp'),
                                  attack: getStat('attack'),
                                  defense: getStat('defense'),
                                  spAttack: getStat('special-attack'),
                                  spDefense: getStat('special-defense'),
                                  speed: getStat('speed'),
                              },
                              ability: megaData.abilities[0]?.ability?.name || 'unknown',
                              types: megaData.types.map((t: any) => t.type.name),
                              spriteUrl: megaSpriteUrl,
                              backSpriteUrl: megaBackSpriteUrl,
                              pixelSpriteUrl: megaPixelSpriteUrl,
                              weight: megaData.weight || 500
                          };

                          // Atualiza o estado
                          setState(prev => {
                              const updateProfile = (target: Pokemon) => {
                                  if (target.id === p.id) {
                                      return { ...target, megaProfile: realMegaProfile };
                                  }
                                  return target;
                              };

                              const newTeam1 = prev.team1.map(updateProfile);
                              const newTeam2 = prev.team2.map(updateProfile);
                              const newActive1 = prev.currentPokemon1?.id === p.id ? updateProfile(prev.currentPokemon1) : prev.currentPokemon1;
                              const newActive2 = prev.currentPokemon2?.id === p.id ? updateProfile(prev.currentPokemon2) : prev.currentPokemon2;

                              return {
                                  ...prev,
                                  team1: newTeam1,
                                  team2: newTeam2,
                                  currentPokemon1: newActive1,
                                  currentPokemon2: newActive2
                              };
                          });
                      })
                      .catch(e => {
                          console.warn(`[MegaHydration] Erro ao buscar ${megaApiName}:`, e);
                      })
                      .finally(() => {
                          fetchingIds.current.delete(p.id);
                      });
              }
          }
          // Limpeza: Perdeu a Pedra mas ainda tem Perfil (e não virou Mega)
          else if (!stoneSuffix && p.megaProfile && !alreadyMega) {
              setState(prev => {
                  const removeProfile = (target: Pokemon) => {
                      if (target.id === p.id) {
                          const { megaProfile, ...rest } = target;
                          return rest;
                      }
                      return target;
                  };

                  const newTeam1 = prev.team1.map(removeProfile);
                  const newTeam2 = prev.team2.map(removeProfile);
                  const newActive1 = prev.currentPokemon1?.id === p.id ? removeProfile(prev.currentPokemon1) : prev.currentPokemon1;
                  const newActive2 = prev.currentPokemon2?.id === p.id ? removeProfile(prev.currentPokemon2) : prev.currentPokemon2;

                  return {
                      ...prev,
                      team1: newTeam1,
                      team2: newTeam2,
                      currentPokemon1: newActive1,
                      currentPokemon2: newActive2
                  };
              });
          }
      });
  }, [heldItemsSignature, activeIdsSignature]); 

  const updateStateWithLogs = (newState: BattleState, logs: any[]) => {
      setState(prev => ({ ...newState, logs: [...prev.logs, ...logs] }));
  };

  const resetBattle = () => {
      setState({...state, isBattleInProgress: false, winner: null});
      localStorage.removeItem(KEY_BATTLE_STATE);
  };

  const generateRandomInventory = (team: Pokemon[], megaEnabled: boolean): PlayerInventory => {
      const allItemKeys = Object.keys(ITEMS_DATA);
      const baseItemCount = Math.floor(Math.random() * 3) + 10; 
      const itemCount = megaEnabled ? baseItemCount + 6 : baseItemCount;

      const items: {id: string, quantity: number}[] = [];
      
      items.push({ id: 'potion', quantity: 2 });
      items.push({ id: 'revive', quantity: 1 });
      items.push({ id: 'full-heal', quantity: 1 });

      for (let i = items.length; i < itemCount; i++) {
          const randomKey = allItemKeys[Math.floor(Math.random() * allItemKeys.length)];
          const existing = items.find(it => it.id === randomKey);
          if (existing) existing.quantity++;
          else items.push({ id: randomKey, quantity: 1 });
      }

      if (megaEnabled) {
          team.forEach(p => {
              const key = p.name.toLowerCase().replace(/ /g, '-');
              const stones = POKEMON_TO_MEGA_STONES[key];
              
              if (stones) {
                  stones.forEach(stoneId => {
                      const existing = items.find(it => it.id === stoneId);
                      if (!existing) {
                          items.push({ id: stoneId, quantity: 1 });
                      }
                  });
              }
          });
      }

      return { items };
  };

  const startBattle = async () => {
    setIsLoading(true);
    try {
      let t1: Pokemon[] = [];
      let t2: Pokemon[] = [];

      if (config.p1Mode === 'builder' || config.p1Mode === 'import') {
          if (p1CustomTeamRef.current && p1CustomTeamRef.current.length > 0) {
              t1 = structuredClone(p1CustomTeamRef.current).slice(0, config.p1TeamSize);
          } else {
              throw new Error(`Erro: Time do Jogador 1 não foi construído ou importado corretamente.`);
          }
      } else {
          t1 = await fetchTeam(config.p1TeamSize, config.p1Mode, config.p1Input, config.randomIvs, config.randomLevels, config.megaEvolutionEnabled, config.itemsEnabled);
      }

      if ((config.p2Mode as any) === 'builder' || config.p2Mode === 'import') {
          if (p2CustomTeamRef.current && p2CustomTeamRef.current.length > 0) {
               t2 = structuredClone(p2CustomTeamRef.current).slice(0, config.p2TeamSize);
          } else {
               throw new Error(`Erro: Time do Oponente não foi construído ou importado corretamente.`);
          }
      } else {
          t2 = await fetchTeam(config.p2TeamSize, config.p2Mode, config.p2Input, config.randomIvs, config.randomLevels, config.megaEvolutionEnabled, config.itemsEnabled);
      }

      if (t1.length === 0 || t2.length === 0) {
          throw new Error("Equipe incompleta. Verifique se selecionou o modo correto ou completou o time no Construtor.");
      }

      [...t1, ...t2].forEach(p => {
          p.hp = p.maxHP;
          p.isFainted = false;
          p.statusEffects = {};
          p.statStages = { accuracy: 0, evasion: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
          p.turnsActive = 0;
          p.isTerastallized = false;
          p.isFlinched = false;
          p.chargingMove = null;
          p.mustRecharge = false;
          p.lockedMove = null;
          p.movesUsed = [];
          p.lastMoveUsed = null;
          p.lastMoveFailed = false;
          p.protectCounter = 0;
          p.movedThisTurn = false;
          p.selectedMove = null;
          p.consumedItem = null;
          p.hadItem = !!p.heldItem;
          if (p.illusionData) delete p.illusionData;
      });

      const p1 = t1[0]; const p2 = t2[0];
      
      const initialLogs = [{ message: "A Batalha Começou!", color: "text-indigo-700 font-bold" }];
      initialLogs.push({message: `Você enviou ${p1.name}!`, color: 'text-green-600'});
      initialLogs.push({message: `O oponente enviou ${p2.name}!`, color: 'text-red-600'});

      const p1Inv = config.itemsEnabled ? generateRandomInventory(t1, config.megaEvolutionEnabled) : { items: [] };
      const p2Inv = config.itemsEnabled ? generateRandomInventory(t2, config.megaEvolutionEnabled) : { items: [] };

      const seed = Math.floor(Math.random() * 1000000);
      enableDeterministicRandom(seed);

      const newReplay: BattleReplay = {
        initialState: {
          team1: structuredClone(t1),
          team2: structuredClone(t2),
          p1Inventory: structuredClone(p1Inv),
          p2Inventory: structuredClone(p2Inv),
          config: structuredClone(config)
        },
        seed,
        events: []
      };
      setCurrentReplay(newReplay);

      const initialState: BattleState = {
        team1: t1, team2: t2, currentPokemon1: p1, currentPokemon2: p2,
        p1Inventory: p1Inv, 
        p2Inventory: p2Inv,
        p1TeraUsed: false,
        p2TeraUsed: false,
        p1MegaUsed: false,
        p2MegaUsed: false,
        turn: 1, weather: 'none', weatherTurns: 0, terrain: 'none', terrainTurns: 0,
        gravity: false, gravityTurns: 0, 
        mudSportTurns: 0, 
        waterSportTurns: 0,
        ionDelugeActive: false,
        wonderRoomActive: false, wonderRoomTurns: 0,
        magicRoomActive: false, magicRoomTurns: 0,
        trickRoomActive: false, trickRoomTurns: 0,
        p1Hazards: { toxicSpikes: 0, reflect: 0, lightScreen: 0, safeguard: 0, mist: 0, luckyChant: 0, auroraVeil: 0, stealthRock: false, stickyWeb: false, spikes: 0, tailwind: 0 }, 
        p2Hazards: { toxicSpikes: 0, reflect: 0, lightScreen: 0, safeguard: 0, mist: 0, luckyChant: 0, auroraVeil: 0, stealthRock: false, stickyWeb: false, spikes: 0, tailwind: 0 },
        logs: initialLogs, isBattleInProgress: true, winner: null, waitingForAction: false
      };
      
      const entryLogs: any[] = [];
      Effects.handleEntryAbilities(p1, p2, config.weatherEnabled, entryLogs, initialState);
      Effects.handleEntryAbilities(p2, p1, config.weatherEnabled, entryLogs, initialState);
      initialState.logs = [...initialState.logs, ...entryLogs];
      setState(initialState);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    state, setState,
    config, setConfig,
    isLoading, setIsLoading,
    resetBattle,
    startBattle,
    updateStateWithLogs,
    p1CustomTeamRef,
    p2CustomTeamRef,
    stateRef,
    configRef,
    currentReplay,
    setCurrentReplay
  };
};


import React, { useState } from 'react';
import { Pokemon, Move, PokemonStats } from '../types';
import { ITEMS_DATA, MEGA_STONES } from '../data/items';
import { fetchTeam, fetchRawPokemonData } from '../services/api';
import { POKEMON_LIST } from '../data/pokedex_list';
import { TYPE_NAMES_PT } from '../data/types';
import { NATURES } from '../data/natures';
import { calculateMaxHP } from '../services/engine/handlers/statCalculator';
import { ABILITY_EFFECTS } from '../data/abilities';

interface TeamBuilderModalProps {
  onSave: (team: Pokemon[]) => void;
  onCancel: () => void;
  playerNum: 1 | 2; 
  initialTeam: Pokemon[] | null;
  teamSize: number;
  randomLevels: boolean; // Prop para controlar exibição
}

interface BuilderSlot {
  id: number;
  nameInput: string;
  suggestions: string[];
  pokemon: Pokemon | null;
  isLoading: boolean;
  error: string | null;
  showStats: boolean;
}

export const TeamBuilderModal: React.FC<TeamBuilderModalProps> = ({ onSave, onCancel, playerNum, initialTeam, teamSize, randomLevels }) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState('');

  const [slots, setSlots] = useState<BuilderSlot[]>(() => {
      const initialSlots = Array(6).fill(null).map((_, i) => ({
          id: i,
          nameInput: '',
          suggestions: [],
          pokemon: null,
          isLoading: false,
          error: null,
          showStats: false
      }));

      if (initialTeam && initialTeam.length > 0) {
          initialTeam.forEach((p, i) => {
              if (i < 6) {
                  initialSlots[i].pokemon = p;
                  initialSlots[i].nameInput = p.name;
              }
          });
      }
      return initialSlots;
  });

  const updateSlot = (index: number, updates: Partial<BuilderSlot>) => {
    setSlots(prev => prev.map((slot, i) => i === index ? { ...slot, ...updates } : slot));
  };

  const handleNameChange = (index: number, value: string) => {
      const updates: Partial<BuilderSlot> = { nameInput: value };
      if (value.length >= 2) {
          const lowerValue = value.toLowerCase();
          const filtered = POKEMON_LIST
              .filter(p => p.includes(lowerValue))
              .slice(0, 5);
          updates.suggestions = filtered;
      } else {
          updates.suggestions = [];
      }
      updateSlot(index, updates);
  };

  const handleSuggestionClick = (index: number, suggestion: string) => {
      updateSlot(index, { nameInput: suggestion, suggestions: [] });
      handleFetchPokemon(index, suggestion);
  };

  const handleFetchPokemon = async (index: number, overrideName?: string) => {
    const slot = slots[index];
    const searchTerm = overrideName || slot.nameInput.trim();
    if (!searchTerm) return;
    updateSlot(index, { isLoading: true, error: null, suggestions: [] });
    try {
      // Fetch usa randomLevels para setar level inicial
      const team = await fetchTeam(1, 'manual', searchTerm.toLowerCase(), true, randomLevels);
      if (team && team.length > 0) {
        updateSlot(index, { pokemon: team[0], isLoading: false });
      } else {
        updateSlot(index, { error: 'Não encontrado', isLoading: false });
      }
    } catch (e) {
      updateSlot(index, { error: 'Erro ao buscar', isLoading: false });
    }
  };

  const generateRandomStats = (pokemon: Pokemon): Pokemon => {
      const p = { ...pokemon };
      
      // 1. IVs Aleatórios (0-31)
      const randomIVs: PokemonStats = {
          hp: Math.floor(Math.random() * 32),
          attack: Math.floor(Math.random() * 32),
          defense: Math.floor(Math.random() * 32),
          spAttack: Math.floor(Math.random() * 32),
          spDefense: Math.floor(Math.random() * 32),
          speed: Math.floor(Math.random() * 32)
      };

      // 2. Natureza Aleatória
      const natureKeys = Object.keys(NATURES);
      const randomNature = natureKeys[Math.floor(Math.random() * natureKeys.length)];

      // 3. EVs Aleatórios Balanceados (Ponderados pelos Base Stats)
      const evs: PokemonStats = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
      const statsList: (keyof PokemonStats)[] = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];
      
      // Define pesos baseados nos stats base do Pokémon
      const isPhysical = p.attackStat >= p.spAttackStat;
      
      const weights: Record<keyof PokemonStats, number> = {
          hp: 60, // Peso base para HP (garante alguma sobrevivência)
          attack: isPhysical ? p.attackStat * 2.5 : 0, // Foca no ofensivo dominante
          defense: p.defenseStat,
          spAttack: !isPhysical ? p.spAttackStat * 2.5 : 0,
          spDefense: p.spDefenseStat,
          speed: p.speedStat * 1.5 // Velocidade é sempre valiosa
      };

      // Ajustes finos de arquétipo
      if (p.speedStat > 100) {
          weights.speed *= 1.5; // Sweepers rápidos querem muita velocidade
          weights.hp *= 0.5;    // e menos HP
      } else if (p.speedStat < 60) {
          weights.hp *= 1.5;    // Tanks lentos querem muito HP
          weights.speed *= 0.2; // e ignoram velocidade (exceto Trick Room, mas assumimos Bulky padrão)
      }

      // Distribuição Iterativa de 508 EVs
      let remainingEVs = 508;
      const chunkSize = 4; // Distribui em blocos de 4 (mínimo para 1 ponto de stat)

      while (remainingEVs >= chunkSize) {
          // Calcula peso total dos stats que ainda podem receber EVs (< 252)
          let totalWeight = 0;
          const candidates: (keyof PokemonStats)[] = [];
          
          statsList.forEach(stat => {
              if (evs[stat] < 252) {
                  candidates.push(stat);
                  totalWeight += weights[stat];
              }
          });

          if (candidates.length === 0) break; // Todos os stats cheios (não deve acontecer com 508)

          // Roleta ponderada para escolher onde colocar o próximo bloco
          let random = Math.random() * totalWeight;
          for (const stat of candidates) {
              random -= weights[stat];
              if (random <= 0) {
                  // Adiciona EVs respeitando limites
                  const amount = Math.min(chunkSize, 252 - evs[stat], remainingEVs);
                  evs[stat] += amount;
                  remainingEVs -= amount;
                  break;
              }
          }
      }

      p.ivs = randomIVs;
      p.evs = evs;
      p.nature = randomNature;

      return p;
  };

  const handleRandomSlot = async (index: number) => {
      updateSlot(index, { isLoading: true, error: null, suggestions: [] });
      try {
          const team = await fetchTeam(1, 'random', '', true, randomLevels);
          if (team && team.length > 0) {
              // Aplica randomização completa de stats ao Pokémon gerado
              const randomizedPokemon = generateRandomStats(team[0]);
              
              updateSlot(index, { 
                  pokemon: randomizedPokemon, 
                  isLoading: false, 
                  nameInput: randomizedPokemon.name 
              });
          } else {
              updateSlot(index, { error: 'Erro ao gerar', isLoading: false });
          }
      } catch (e) {
          updateSlot(index, { error: 'Erro na API', isLoading: false });
      }
  };

  const handleLevelChange = (index: number, newLevel: number) => {
      const slot = slots[index];
      if (!slot.pokemon) return;

      const level = Math.max(1, Math.min(100, newLevel));
      
      // Recalcula MaxHP se tivermos o BaseHP
      let newMaxHP = slot.pokemon.maxHP;
      
      // Se tiver baseHp (novo sistema), calcula exato.
      // Se não tiver (legado), tenta aproximar ou mantém (seguro).
      if (slot.pokemon.baseHp) {
          const iv = slot.pokemon.ivs?.hp || 31;
          const ev = slot.pokemon.evs?.hp || 0;
          newMaxHP = calculateMaxHP(slot.pokemon.baseHp, iv, ev, level);
      } else {
          // Fallback seguro: se não tiver baseHp, mantemos o HP atual para não quebrar.
          // O usuário terá que gerar novo pokemon para usar feature de nivel.
      }

      const p = { 
          ...slot.pokemon, 
          level: level,
          maxHP: newMaxHP,
          hp: newMaxHP // Cura ao mudar de nível no builder
      };
      
      updateSlot(index, { pokemon: p });
  };

  const handleStatChange = (index: number, type: 'evs' | 'ivs', stat: keyof PokemonStats, value: number) => {
      const slot = slots[index];
      if (!slot.pokemon) return;

      const p = { ...slot.pokemon };
      const maxVal = type === 'evs' ? 252 : 31;
      const cleanValue = Math.max(0, Math.min(maxVal, value));

      if (!p[type]) p[type] = type === 'evs' 
          ? { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 }
          : { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 };

      if (type === 'evs') {
          const currentTotal = (Object.values(p.evs!) as number[]).reduce((a, b) => a + b, 0);
          const diff = cleanValue - (p.evs![stat] || 0);
          if (currentTotal + diff > 510) return; 
      }

      p[type] = { ...p[type]!, [stat]: cleanValue };
      
      // Recalcula MaxHP se alterar HP IV/EV
      if (stat === 'hp' && p.baseHp) {
          const level = p.level || 50;
          const iv = p.ivs?.hp || 31;
          const ev = p.evs?.hp || 0;
          p.maxHP = calculateMaxHP(p.baseHp, iv, ev, level);
          p.hp = p.maxHP;
      }

      updateSlot(index, { pokemon: p });
  };

  const handleNatureChange = (index: number, natureName: string) => {
      const slot = slots[index];
      if (!slot.pokemon) return;
      const p = { ...slot.pokemon, nature: natureName };
      updateSlot(index, { pokemon: p });
  };

  const handleAbilityChange = (index: number, abilityName: string) => {
      const slot = slots[index];
      if (!slot.pokemon) return;
      const p = { ...slot.pokemon, ability: abilityName };
      updateSlot(index, { pokemon: p });
  };

  const handleItemChange = async (index: number, itemId: string) => {
    const slot = slots[index];
    if (!slot.pokemon) return;

    // Optimistic Update
    const newPokemon = { ...slot.pokemon, heldItem: itemId || null, hadItem: !!itemId };
    
    // Se trocou de item, remove o perfil mega anterior (se houver)
    if (newPokemon.megaProfile) {
        newPokemon.megaProfile = undefined;
    }

    // Lógica para Silvally (Sistema RKS)
    if (newPokemon.name === 'Silvally') {
        const isShiny = newPokemon.isShiny;
        if (itemId && itemId.endsWith('-memory')) {
            const type = itemId.split('-')[0];
            newPokemon.types = [type];
            newPokemon.spriteUrl = isShiny 
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/773.png`
                : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/773.png`;
            newPokemon.backSpriteUrl = isShiny
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/773-${type}.png`
                : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/773-${type}.png`;
            newPokemon.pixelSpriteUrl = isShiny
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/773-${type}.png`
                : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/773-${type}.png`;
        } else {
            newPokemon.types = ['normal'];
            newPokemon.spriteUrl = isShiny 
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/773.png`
                : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/773.png`;
            newPokemon.backSpriteUrl = isShiny
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/773.png`
                : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/773.png`;
            newPokemon.pixelSpriteUrl = isShiny
                ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/773.png`
                : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/773.png`;
        }
    }

    // Atualiza o estado visual imediatamente
    updateSlot(index, { pokemon: newPokemon });

    // Lógica Assíncrona para Mega Pedra
    if (itemId && MEGA_STONES[itemId]) {
        updateSlot(index, { isLoading: true });

        try {
            const suffix = MEGA_STONES[itemId];
            // Tenta construir o nome da API
            const baseName = slot.pokemon.name.toLowerCase().replace(/ /g, '-');
            const megaApiName = `${baseName}${suffix}`;
            
            const megaData = await fetchRawPokemonData(megaApiName);
            const getStat = (source: any, name: string) => source.stats.find((s: any) => s.stat.name === name)?.base_stat || 50;
            const formatName = (str: string) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

            // Tratamento de Sprites (incluindo Shiny)
            const isShiny = slot.pokemon.isShiny;
            let spriteUrl = megaData.sprites.other?.['official-artwork']?.front_default || megaData.sprites.front_default;
            let backSpriteUrl = megaData.sprites.back_default || megaData.sprites.front_default;
            let pixelSpriteUrl = megaData.sprites.front_default;

            if (isShiny) {
                if (megaData.sprites.other?.['official-artwork']?.front_shiny) {
                    spriteUrl = megaData.sprites.other['official-artwork'].front_shiny;
                } else if (megaData.sprites.front_shiny) {
                    spriteUrl = megaData.sprites.front_shiny;
                }
                
                if (megaData.sprites.back_shiny) backSpriteUrl = megaData.sprites.back_shiny;
                if (megaData.sprites.front_shiny) pixelSpriteUrl = megaData.sprites.front_shiny;
            }

            const megaProfile = {
                name: formatName(megaData.name),
                stats: {
                    hp: getStat(megaData, 'hp'),
                    attack: getStat(megaData, 'attack'),
                    defense: getStat(megaData, 'defense'),
                    spAttack: getStat(megaData, 'special-attack'),
                    spDefense: getStat(megaData, 'special-defense'),
                    speed: getStat(megaData, 'speed'),
                },
                ability: megaData.abilities[0]?.ability?.name || 'unknown',
                types: megaData.types.map((t: any) => t.type.name),
                spriteUrl: spriteUrl,
                backSpriteUrl: backSpriteUrl,
                pixelSpriteUrl: pixelSpriteUrl,
                weight: megaData.weight || 500
            };

            // Atualiza novamente o slot com o perfil mega
            updateSlot(index, { 
                pokemon: { ...newPokemon, megaProfile },
                isLoading: false 
            });

        } catch (e) {
            console.warn(`Falha ao carregar dados Mega para ${itemId}`, e);
            // Remove loading mas mantém o item
            updateSlot(index, { isLoading: false });
        }
    }
  };

  const handleSmartItem = (index: number) => {
      const slot = slots[index];
      if (!slot.pokemon) return;
      const p = slot.pokemon;
      let recommendedItem = 'leftovers';

      const ability = p.ability.toLowerCase();
      const moves = p.moves.map(m => m.name);
      
      // Categorização de movimentos
      const statusCount = p.moves.filter(m => m.damageClass === 'status').length;
      const attackCount = p.moves.filter(m => m.damageClass !== 'status').length;
      const physicalCount = p.moves.filter(m => m.damageClass === 'physical').length;
      const specialCount = p.moves.filter(m => m.damageClass === 'special').length;

      // Análise de Stats (Nível 50 aproximado)
      const isFragile = p.maxHP < 135 && p.defenseStat < 100 && p.spDefenseStat < 100;
      const isFast = p.speedStat > 140;
      const isVeryFast = p.speedStat > 160;

      // --- 1. Imunidades e Sinergias (Hard Overrides) ---
      
      if (moves.includes('acrobatics')) {
          handleItemChange(index, '');
          return;
      }

      if (moves.includes('trick') || moves.includes('switcheroo')) {
          handleItemChange(index, 'choice-scarf');
          return;
      }

      if (moves.some(m => ['reflect', 'light-screen', 'aurora-veil'].includes(m))) {
          handleItemChange(index, 'light-clay');
          return;
      }

      if (ability === 'compound-eyes' && p.moves.some(m => m.accuracy < 90 && m.damageClass !== 'status')) {
          // Fallback para expert-belt se wide-lens não existir no dataset atual
          recommendedItem = ITEMS_DATA['wide-lens'] ? 'wide-lens' : 'expert-belt';
          handleItemChange(index, recommendedItem);
          return;
      }

      if (ability === 'guts') {
          handleItemChange(index, 'flame-orb');
          return;
      }

      if (ability === 'poison-heal' || ability === 'toxic-boost') {
          handleItemChange(index, 'toxic-orb');
          return;
      }

      if (ability === 'unburden') {
          if (moves.includes('shell-smash') || moves.includes('close-combat') || moves.includes('draco-meteor') || moves.includes('leaf-storm') || moves.includes('overheat')) {
              handleItemChange(index, 'white-herb');
          } else {
              handleItemChange(index, 'sitrus-berry');
          }
          return;
      }

      if (ability === 'harvest' || ability === 'cheek-pouch') {
          handleItemChange(index, 'sitrus-berry');
          return;
      }

      if (ability === 'imposter') {
          handleItemChange(index, 'choice-scarf');
          return;
      }

      if (ability === 'gorilla-tactics') {
          handleItemChange(index, 'choice-band');
          return;
      }

      if (ability === 'magic-guard' || ability === 'sheer-force') {
          handleItemChange(index, 'life-orb');
          return;
      }

      // --- 2. Tomada de Decisão por Papel ---

      // Assault Vest: 4 ataques e SpDef decente (ou só 4 ataques)
      if (statusCount === 0 && attackCount === 4) {
          handleItemChange(index, 'assault-vest');
          return;
      }

      // Setup Sweeper
      const setupMoves = ['swords-dance', 'dragon-dance', 'nasty-plot', 'quiver-dance', 'shell-smash', 'bulk-up', 'calm-mind', 'rock-polish', 'agility', 'autotomize', 'shift-gear', 'tail-glow', 'belly-drum', 'coil'];
      if (moves.some(m => setupMoves.includes(m))) {
          if (isFragile) handleItemChange(index, 'focus-sash');
          else handleItemChange(index, 'life-orb'); // ou lum-berry
          return;
      }

      // All-Out Attacker / Glass Cannon
      if (attackCount >= 3) {
          if (isVeryFast && isFragile) {
              handleItemChange(index, 'life-orb'); // ou focus-sash
              return;
          }
          
          if (isFragile && isFast) {
              handleItemChange(index, 'focus-sash');
              return;
          }

          if (physicalCount >= 3 || (physicalCount > specialCount && p.attackStat > p.spAttackStat)) {
              handleItemChange(index, 'choice-band');
              return;
          }

          if (specialCount >= 3 || (specialCount > physicalCount && p.spAttackStat > p.attackStat)) {
              handleItemChange(index, 'choice-specs');
              return;
          }

          // Lento e Ofensivo
          if (!isFast && (p.attackStat > 110 || p.spAttackStat > 110)) {
              handleItemChange(index, 'life-orb');
              return;
          }
      }

      // Defensive / Stall
      const recoveryMoves = ['recover', 'roost', 'slack-off', 'soft-boiled', 'milk-drink', 'moonlight', 'morning-sun', 'synthesis', 'shore-up', 'heal-order', 'wish'];
      const stallMoves = ['toxic', 'will-o-wisp', 'thunder-wave', 'leech-seed', 'protect', 'substitute', 'spikes', 'stealth-rock', 'toxic-spikes', 'sticky-web'];
      const hasRecovery = moves.some(m => recoveryMoves.includes(m));
      const hasStall = moves.some(m => stallMoves.includes(m));

      if ((hasRecovery || hasStall) && !isFragile) {
          if (p.defenseStat > p.spDefenseStat * 1.1) {
              handleItemChange(index, 'rocky-helmet');
          } else {
              handleItemChange(index, 'leftovers');
          }
          return;
      }

      // --- 3. Fallback ---
      if (p.maxHP >= 150) {
          recommendedItem = 'leftovers';
      } else {
          // Atacantes genéricos que sobraram
          recommendedItem = 'sitrus-berry';
      }
      
      handleItemChange(index, recommendedItem);
  };

  const handleRegenerateMoves = (index: number) => {
      const slot = slots[index];
      if (!slot.pokemon || !slot.pokemon.movePool) return;
      const pool = slot.pokemon.movePool;
      const newMoves: Move[] = [];
      const usedNames = new Set<string>();
      let attempts = 0;
      while (newMoves.length < 4 && attempts < 50) {
          const candidate = pool[Math.floor(Math.random() * pool.length)];
          if (!usedNames.has(candidate.name)) {
              newMoves.push(candidate);
              usedNames.add(candidate.name);
          }
          attempts++;
      }
      updateSlot(index, { pokemon: { ...slot.pokemon, moves: newMoves } });
  };

  const handleRerollMove = (slotIndex: number, moveIndex: number) => {
      const slot = slots[slotIndex];
      if (!slot.pokemon || !slot.pokemon.movePool) return;
      const pool = slot.pokemon.movePool;
      const randomMove = pool[Math.floor(Math.random() * pool.length)];
      const updatedMoves = [...slot.pokemon.moves];
      updatedMoves[moveIndex] = randomMove;
      updateSlot(slotIndex, { pokemon: { ...slot.pokemon, moves: updatedMoves } });
  };

  const handleSave = () => {
    const fullTeam = slots.filter(s => s.pokemon !== null).map(s => s.pokemon!);
    onSave(fullTeam);
  };

  const itemOptions = Object.entries(ITEMS_DATA)
    .filter(([_, data]) => ['held', 'plate', 'memory', 'berry'].includes(data.category))
    .sort((a, b) => a[1].name.localeCompare(b[1].name));

  const naturesList = Object.keys(NATURES).sort();
  const statLabels: Record<string, string> = { hp: 'HP', attack: 'Atk', defense: 'Def', spAttack: 'SpA', spDefense: 'SpD', speed: 'Spe' };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div className={`bg-white p-6 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto border-4 ${playerNum === 1 ? 'border-green-500' : 'border-red-500'} flex flex-col`}>
        <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-2xl font-black text-gray-800">Construtor de Equipe (P{playerNum})</h2>
            <div className="flex gap-2 items-center">
                <button 
                    onClick={() => setShowImportModal(true)}
                    className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded font-bold hover:bg-indigo-200 border border-indigo-200"
                >
                    📥 Importar Time (JSON)
                </button>
                <button 
                    onClick={() => {
                        const currentTeam = slots.filter(s => s.pokemon !== null).map(s => s.pokemon!);
                        if (currentTeam.length === 0) return;
                        const json = JSON.stringify(currentTeam, null, 2);
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `equipe_p${playerNum}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        alert('Time exportado com sucesso!');
                    }}
                    className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded font-bold hover:bg-indigo-200 border border-indigo-200"
                    disabled={slots.filter(s => s.pokemon !== null).length === 0}
                >
                    📤 Exportar Time (JSON)
                </button>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 font-bold text-2xl ml-2">✕</button>
            </div>
        </div>

        {showImportModal && (
            <div className="mb-6 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-xl relative">
                <button onClick={() => setShowImportModal(false)} className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-600 font-bold">✕</button>
                <h3 className="text-indigo-800 font-bold mb-2 text-sm">Importar Time (Formato JSON)</h3>
                <textarea 
                    className="w-full h-32 p-2 text-xs border border-indigo-200 rounded resize-none focus:outline-none focus:border-indigo-400"
                    placeholder="Cole o JSON do time aqui..."
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                />
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-indigo-600">{importStatus}</span>
                    <button 
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded font-bold text-xs hover:bg-indigo-700"
                        onClick={async () => {
                            if (!importText.trim()) return;
                            setImportStatus('Carregando...');
                            try {
                                const team = JSON.parse(importText);
                                if (Array.isArray(team) && team.length > 0) {
                                    // Preencher os slots
                                    const newSlots = [...slots];
                                    team.forEach((p, i) => {
                                        if (i < 6) {
                                            // Correção para Silvally importado com sprite antigo (Lurantis Totem)
                                            if (p.name === 'Silvally') {
                                                const isShiny = p.isShiny;
                                                if (p.heldItem && p.heldItem.endsWith('-memory')) {
                                                    const type = p.heldItem.split('-')[0];
                                                    p.types = [type];
                                                    p.spriteUrl = isShiny 
                                                        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/773.png`
                                                        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/773.png`;
                                                    p.backSpriteUrl = isShiny
                                                        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/773-${type}.png`
                                                        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/773-${type}.png`;
                                                    p.pixelSpriteUrl = isShiny
                                                        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/773-${type}.png`
                                                        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/773-${type}.png`;
                                                } else {
                                                    p.types = ['normal'];
                                                    p.spriteUrl = isShiny 
                                                        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/773.png`
                                                        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/773.png`;
                                                    p.backSpriteUrl = isShiny
                                                        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/773.png`
                                                        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/773.png`;
                                                    p.pixelSpriteUrl = isShiny
                                                        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/773.png`
                                                        : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/773.png`;
                                                }
                                            }
                                            newSlots[i].pokemon = p;
                                            newSlots[i].nameInput = p.name;
                                        }
                                    });
                                    setSlots(newSlots);
                                    setImportStatus(`✅ ${team.length} Pokémon carregados!`);
                                    setTimeout(() => {
                                        setShowImportModal(false);
                                        setImportStatus('');
                                        setImportText('');
                                    }, 1500);
                                } else {
                                    setImportStatus('❌ Erro ao carregar. Formato inválido.');
                                }
                            } catch (err) {
                                setImportStatus('❌ Erro ao ler JSON.');
                            }
                        }}
                    >
                        Carregar
                    </button>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {slots.slice(0, teamSize).map((slot, index) => (
            <div key={slot.id} className={`border-2 rounded-xl p-3 flex flex-col gap-2 transition-all ${slot.pokemon ? 'bg-gray-50 border-gray-300' : 'bg-white border-dashed'}`}>
              
              {/* Header do Slot */}
              <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400">SLOT {index + 1}</span>
                  {slot.pokemon && (
                      <div className="flex gap-1">
                          <button onClick={() => updateSlot(index, { showStats: !slot.showStats })} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold hover:bg-blue-200">
                              {slot.showStats ? '▼ Atributos' : '▶ Atributos'}
                          </button>
                          {/* Botão de Slot Aleatório restaurado aqui para permitir reroll fácil */}
                          <button onClick={() => handleRandomSlot(index)} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold hover:bg-yellow-200" title="Trocar por Aleatório">🎲</button>
                          <button onClick={() => updateSlot(index, { pokemon: null, nameInput: '' })} className="text-xs text-red-500 font-bold hover:text-red-700 px-1">🗑️</button>
                      </div>
                  )}
              </div>

              {/* Busca */}
              {!slot.pokemon ? (
                <div className="flex gap-1 relative">
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-full text-sm outline-none focus:border-blue-500 bg-white text-gray-900"
                    placeholder="Pokémon..."
                    value={slot.nameInput}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetchPokemon(index)}
                  />
                  <button className="bg-blue-600 text-white px-2 rounded font-bold" onClick={() => handleFetchPokemon(index)}>🔍</button>
                  <button className="bg-yellow-500 text-white px-2 rounded font-bold" onClick={() => handleRandomSlot(index)}>🎲</button>
                  {slot.suggestions.length > 0 && (
                      <ul className="absolute top-full left-0 w-full bg-white border shadow-lg z-50 rounded-b max-h-32 overflow-y-auto">
                          {slot.suggestions.map(s => (
                              <li key={s} className="px-2 py-1 text-sm hover:bg-blue-50 cursor-pointer capitalize text-gray-800" onClick={() => handleSuggestionClick(index, s)}>{s}</li>
                          ))}
                      </ul>
                  )}
                </div>
              ) : (
                // Exibição do Pokémon
                <div className="flex items-center gap-2">
                    <img src={slot.pokemon?.spriteUrl} className="w-12 h-12 bg-white rounded-full border" />
                    <div>
                        <div className="font-bold text-sm leading-tight text-gray-800">{slot.pokemon?.name ?? 'Pokémon'}</div>
                        <div className="flex gap-1 mt-0.5">
                            {slot.pokemon?.types?.map(t => <span key={t} className={`text-[9px] px-1 rounded text-white type-${t}`}>{TYPE_NAMES_PT[t]}</span>)}
                        </div>
                    </div>
                </div>
              )}

              {/* Editor de Atributos (Expansível) */}
              {slot.pokemon && slot.showStats && (
                  <div className="bg-white p-2 rounded border border-gray-200 text-xs space-y-2 animate-fade-in">
                      {/* Editor de Nível */}
                      {randomLevels && (
                          <div className="flex justify-between items-center bg-gray-100 p-1 rounded">
                              <label className="font-bold text-gray-700">Nível:</label>
                              <input 
                                  type="number" min="1" max="100" 
                                  className="border rounded p-1 w-16 text-center bg-white text-gray-900 font-bold" 
                                  value={slot.pokemon.level || 50}
                                  onChange={(e) => handleLevelChange(index, parseInt(e.target.value) || 50)}
                              />
                          </div>
                      )}

                      {/* Seletor de Habilidade (NOVO) */}
                      {slot.pokemon.possibleAbilities && slot.pokemon.possibleAbilities.length > 0 && (
                          <div className="flex justify-between items-center">
                              <label className="font-bold text-gray-700">Habilidade:</label>
                              <select 
                                  className="border rounded p-1 w-32 bg-white text-gray-900 truncate" 
                                  value={slot.pokemon.ability}
                                  onChange={(e) => handleAbilityChange(index, e.target.value)}
                              >
                                  {slot.pokemon.possibleAbilities.map(ab => (
                                      <option key={ab} value={ab}>
                                          {ABILITY_EFFECTS[ab]?.name || ab}
                                      </option>
                                  ))}
                              </select>
                          </div>
                      )}

                      <div className="flex justify-between items-center">
                          <label className="font-bold text-gray-700">Natureza:</label>
                          <select 
                              className="border rounded p-1 w-32 bg-white text-gray-900" 
                              value={slot.pokemon.nature || 'hardy'}
                              onChange={(e) => handleNatureChange(index, e.target.value)}
                          >
                              {naturesList.map(n => (
                                  <option key={n} value={n}>{NATURES[n].name}</option>
                              ))}
                          </select>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                          <div className="font-bold text-center text-gray-400">Stat</div>
                          <div className="font-bold text-center text-green-600">EV</div>
                          <div className="font-bold text-center text-purple-600">IV</div>
                          
                          {(['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'] as const).map(stat => (
                              <React.Fragment key={stat}>
                                  <div className="flex items-center font-medium text-gray-700">{statLabels[stat]}</div>
                                  <input 
                                      type="number" min="0" max="252" 
                                      className="border rounded px-1 text-center bg-white text-gray-900"
                                      value={slot.pokemon?.evs?.[stat] || 0}
                                      onChange={(e) => handleStatChange(index, 'evs', stat, parseInt(e.target.value) || 0)}
                                  />
                                  <input 
                                      type="number" min="0" max="31" 
                                      className="border rounded px-1 text-center bg-white text-gray-900"
                                      value={slot.pokemon?.ivs?.[stat] || 31} // Default 31 visual
                                      onChange={(e) => handleStatChange(index, 'ivs', stat, parseInt(e.target.value) || 0)}
                                  />
                              </React.Fragment>
                          ))}
                      </div>
                      <div className="text-[10px] text-gray-500 text-right">
                          Total EVs: {(Object.values(slot.pokemon.evs || {}) as number[]).reduce((a, b) => a + b, 0)}/510
                      </div>
                  </div>
              )}

              {/* Item e Golpes */}
              {slot.pokemon && !slot.showStats && (
                  <>
                    <div className="flex gap-1">
                        <select className="flex-1 border rounded text-xs px-1 bg-white text-gray-900" value={slot.pokemon.heldItem || ''} onChange={(e) => handleItemChange(index, e.target.value)}>
                            <option value="">(Sem Item)</option>
                            {itemOptions.map(([id, data]) => <option key={id} value={id}>{data.name}</option>)}
                        </select>
                        <button onClick={() => handleSmartItem(index)} className="text-blue-500 font-bold px-1" title="Sugerir Item Inteligente">✨</button>
                    </div>
                    {slot.pokemon.megaProfile && (
                        <div className="text-[9px] text-center bg-pink-100 text-pink-700 font-bold rounded px-1 border border-pink-200">
                            MEGA DISPONÍVEL
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-1">
                        {slot.pokemon.moves.map((m, i) => (
                            <div key={i} className={`text-[9px] px-1 py-0.5 rounded text-white font-bold type-${m.type} flex justify-between items-center cursor-pointer hover:opacity-80`} onClick={() => handleRerollMove(index, i)} title="Clique para trocar">
                                <span className="truncate">{m.displayName}</span>
                                <span>↻</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => handleRegenerateMoves(index)} className="text-[10px] text-gray-500 underline text-center w-full">Regenerar Golpes</button>
                  </>
              )}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t flex justify-end gap-3">
            <button className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100" onClick={onCancel}>Cancelar</button>
            <button className="px-6 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md" onClick={handleSave} disabled={slots.slice(0, teamSize).some(s => !s.pokemon)}>Salvar Equipe</button>
        </div>
      </div>
    </div>
  );
};


import { Pokemon, Move, PokemonStats } from '../../types';
import { ITEMS_DATA, MEGA_STONES, POKEMON_TO_MEGA_STONES } from '../../data/items';
import { POKEMON_NAME_TRANSLATIONS, NAME_SUFFIX_TRANSLATIONS, ALWAYS_MALE, ALWAYS_FEMALE, ALWAYS_GENDERLESS } from '../../data/pokemon';
import { NATURES } from '../../data/natures';
import { calculateMaxHP } from '../engine/handlers/statCalculator';
import { fetchMoveDetails, fetchRawPokemonData } from './client';
import { POKEMON_LIST } from '../../data/pokedex_list';

export const MAX_POKEMON_ID = 1025;
const MOVE_FETCH_CAP = 60; // Increased to ensure variety

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatPokemonName(name: string): string {
    if (POKEMON_NAME_TRANSLATIONS[name]) {
        return POKEMON_NAME_TRANSLATIONS[name];
    }

    let formatted = name;
    
    for (const [suffix, translation] of Object.entries(NAME_SUFFIX_TRANSLATIONS)) {
        if (formatted.endsWith(suffix)) {
            formatted = formatted.replace(suffix, translation);
            break;
        }
    }

    return formatted.split(/[- ]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
}

export async function fetchPokemonData(
    identifier: string | number, 
    isRandomMode: boolean = false, 
    randomIvs: boolean = true, 
    randomLevels: boolean = false,
    megaEnabled: boolean = false,
    itemsEnabled: boolean = true
): Promise<Pokemon> {
  const data = await fetchRawPokemonData(identifier);

  if (!data || !data.types) {
      console.error("INVALID DATA FOR", identifier, data);
  }

  let types = data.types.map((t: any) => t.type.name);
  const getStat = (source: any, name: string) => source.stats.find((s: any) => s.stat.name === name)?.base_stat || 50;
  
  let heldItem = null;
  if (data.held_items?.length > 0 && Math.random() < 0.5) {
     const apiItem = data.held_items[0].item.name;
     // Allow items if in ITEMS_DATA (includes Mega Stones now)
     if (ITEMS_DATA[apiItem]) {
         const disallowedItems = [
             'choice-band', 'choice-specs', 'choice-scarf', 'life-orb', 
             'assault-vest', 'weakness-policy', 'focus-sash', 'expert-belt', 
             'rocky-helmet', 'safety-goggles', 'heavy-duty-boots', 'room-service', 'red-card', 'eject-button'
         ];
         if (!disallowedItems.includes(apiItem)) heldItem = apiItem;
     }
  }
  
  // Smart Mega Stone Distribution
  // If Mega Evolution is enabled, prioritize giving the Pokémon its specific Mega Stone.
  if (megaEnabled) {
      const lowerName = data.name.toLowerCase();
      const potentialStones = POKEMON_TO_MEGA_STONES[lowerName];
      
      if (potentialStones && potentialStones.length > 0) {
          // If items are enabled (Bag available), chance is lower (20%) to encourage scavenging/bag use.
          // If items are disabled (No Bag), chance is higher (80%) to ensure Mega Evolution is usable.
          const autoEquipChance = itemsEnabled ? 0.2 : 0.8;
          
          if (Math.random() < autoEquipChance) {
              heldItem = potentialStones[Math.floor(Math.random() * potentialStones.length)];
          }
      }
  }
  
  if (!heldItem && Math.random() < 0.15) {
      const allowedWildItems = ['leftovers', 'sitrus-berry', 'lum-berry', 'honey'];
      heldItem = allowedWildItems[Math.floor(Math.random() * allowedWildItems.length)];
  }

  if (data.name.includes('arceus') && !heldItem && Math.random() < 0.8) {
      const plates = Object.keys(ITEMS_DATA).filter(k => ITEMS_DATA[k].category === 'plate');
      heldItem = plates[Math.floor(Math.random() * plates.length)];
  }
  if (data.name.includes('silvally') && !heldItem && Math.random() < 0.8) {
      const memories = Object.keys(ITEMS_DATA).filter(k => ITEMS_DATA[k].category === 'memory');
      heldItem = memories[Math.floor(Math.random() * memories.length)];
  }

  const isShiny = Math.random() < 0.01; 
  let spriteUrl = data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default;
  
  // Pixel Art Sprites Extraction
  let backSpriteUrl = data.sprites.back_default;
  let pixelSpriteUrl = data.sprites.front_default;

  if (isShiny) {
      if (data.sprites.other?.['official-artwork']?.front_shiny) {
          spriteUrl = data.sprites.other['official-artwork'].front_shiny;
      } else if (data.sprites.front_shiny) {
          spriteUrl = data.sprites.front_shiny;
      }
      
      // Update Pixel Sprites for Shiny
      if (data.sprites.back_shiny) backSpriteUrl = data.sprites.back_shiny;
      if (data.sprites.front_shiny) pixelSpriteUrl = data.sprites.front_shiny;
  }
  
  // Fallback se não tiver sprite de costas
  if (!backSpriteUrl) backSpriteUrl = pixelSpriteUrl;

  // --- SILVALLY RKS SYSTEM PRE-FETCH ---
  if (data.name.includes('silvally') && heldItem && heldItem.endsWith('-memory')) {
      const type = heldItem.split('-')[0];
      types = [type]; // Atualiza o tipo para o tipo da memória
      
      // Arte oficial não tem variações de tipo no PokeAPI, mantemos a base
      spriteUrl = isShiny 
          ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/773.png`
          : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/773.png`;
          
      backSpriteUrl = isShiny
          ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/shiny/773-${type}.png`
          : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/773-${type}.png`;
          
      pixelSpriteUrl = isShiny
          ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/773-${type}.png`
          : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/773-${type}.png`;
  }

  // --- MEGA EVOLUTION PRE-FETCH ---
  let megaProfile: Pokemon['megaProfile'] | undefined = undefined;
  if (heldItem && MEGA_STONES[heldItem]) {
      const suffix = MEGA_STONES[heldItem];
      // Construct API Name: e.g. "charizard" + "-mega-x" -> "charizard-mega-x"
      // Handle special cases if necessary (usually API names match this pattern)
      const megaApiName = `${data.name}${suffix}`;
      
      try {
          const megaData = await fetchRawPokemonData(megaApiName);
          
          let megaSpriteUrl = megaData.sprites.other?.['official-artwork']?.front_default || megaData.sprites.front_default;
          let megaBackSpriteUrl = megaData.sprites.back_default;
          let megaPixelSpriteUrl = megaData.sprites.front_default;

          if (isShiny) {
              if (megaData.sprites.other?.['official-artwork']?.front_shiny) {
                  megaSpriteUrl = megaData.sprites.other['official-artwork'].front_shiny;
              } else if (megaData.sprites.front_shiny) {
                  megaSpriteUrl = megaData.sprites.front_shiny;
              }
              
              if (megaData.sprites.back_shiny) megaBackSpriteUrl = megaData.sprites.back_shiny;
              if (megaData.sprites.front_shiny) megaPixelSpriteUrl = megaData.sprites.front_shiny;
          }

          if (!megaBackSpriteUrl) megaBackSpriteUrl = megaPixelSpriteUrl;

          // Mega Name Formatting: "Mega [Name] [Suffix]"
          const baseNameFormatted = formatPokemonName(data.name);
          let megaName = `Mega ${baseNameFormatted}`;
          if (suffix === '-mega-x') megaName += ' X';
          if (suffix === '-mega-y') megaName += ' Y';

          megaProfile = {
              name: megaName,
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
              spriteUrl: megaSpriteUrl,
              backSpriteUrl: megaBackSpriteUrl,
              pixelSpriteUrl: megaPixelSpriteUrl,
              weight: megaData.weight || 500
          };
      } catch (e) {
          console.warn(`Failed to fetch Mega Data for ${megaApiName}`, e);
      }
  }

  // --- MOVES LOGIC OVERHAUL ---
  const rawMoves = data.moves;
  const levelUpMoves = rawMoves.filter((m: any) => 
      m.version_group_details.some((d: any) => d.move_learn_method.name === 'level-up')
  );
  const otherMoves = rawMoves.filter((m: any) => 
      !m.version_group_details.some((d: any) => d.move_learn_method.name === 'level-up')
  );

  const shuffle = (array: any[]) => array.sort(() => 0.5 - Math.random());
  // Prioritize level up moves, then others
  const prioritizedMoves = [...shuffle(levelUpMoves), ...shuffle(otherMoves)].slice(0, MOVE_FETCH_CAP);

  const movePromises = prioritizedMoves.map((m: any) => fetchMoveDetails(m.move.url));
  const allMoves = (await Promise.all(movePromises)).filter((m): m is Move => m !== null);
  
  // Tera Type Determination (Pre-Move Selection to allow Tera Coverage)
  let teraType = types[0];
  if (isRandomMode && Math.random() < 0.3) {
      const allTypes = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'dark', 'fairy'];
      teraType = allTypes[Math.floor(Math.random() * allTypes.length)];
  }

  const selectedMoves: Move[] = [];
  const usedMoveNames = new Set<string>();

  // 1. Bucket Moves
  const stabMoves: Record<string, Move[]> = {};
  const damageMoves: Move[] = [];
  const teraCoverageMoves: Move[] = [];
  
  types.forEach((t: string) => stabMoves[t] = []);

  allMoves.forEach(m => {
      if (m.power > 0) damageMoves.push(m);
      if (types.includes(m.type) && m.power > 0) {
          stabMoves[m.type].push(m);
      }
      if (m.type === teraType && m.power > 0) {
          teraCoverageMoves.push(m);
      }
  });

  // 2. Selection Steps
  
  // Step A: Force 1 STAB move for each type
  types.forEach((t: string) => {
      const moves = stabMoves[t];
      if (moves && moves.length > 0) {
          // Sort by power descending to pick strongest STAB
          moves.sort((a, b) => b.power - a.power);
          const bestStab = moves[0];
          if (!usedMoveNames.has(bestStab.name)) {
              selectedMoves.push(bestStab);
              usedMoveNames.add(bestStab.name);
          }
      }
  });

  // Step B: Tera Coverage (if different from base types)
  if (!types.includes(teraType) && selectedMoves.length < 4) {
      if (teraCoverageMoves.length > 0) {
          teraCoverageMoves.sort((a, b) => b.power - a.power);
          const bestTera = teraCoverageMoves[0];
          if (!usedMoveNames.has(bestTera.name)) {
              selectedMoves.push(bestTera);
              usedMoveNames.add(bestTera.name);
          }
      }
  }

  // Step C: Damage Guarantee
  const hasDamageMove = selectedMoves.some(m => m.power > 0);
  if (!hasDamageMove && selectedMoves.length < 4) {
      // Find any damage move
      const anyDamage = damageMoves.find(m => !usedMoveNames.has(m.name));
      if (anyDamage) {
          selectedMoves.push(anyDamage);
          usedMoveNames.add(anyDamage.name);
      }
  }

  // Step D: Fill remaining slots
  const shuffledPool = allMoves.sort(() => 0.5 - Math.random());
  for (const m of shuffledPool) {
      if (selectedMoves.length >= 4) break;
      if (!usedMoveNames.has(m.name)) {
          selectedMoves.push(m);
          usedMoveNames.add(m.name);
      }
  }

  // 3. Fallback for Empty/Low Sets (Smeargle, Ditto, Unown cases)
  if (selectedMoves.length === 0 || (selectedMoves.length < 4 && selectedMoves.every(m => m.power === 0))) {
      // Ensure at least damage capability
      if (!usedMoveNames.has('tackle')) {
          selectedMoves.push({
              name: 'tackle', displayName: 'Investida', power: 40, type: 'normal', accuracy: 100,
              isStatus: false, damageClass: 'physical', description: 'Um ataque físico básico.',
              uses: 35, maxUses: 35, priority: 0
          });
      }
  }
  
  if (selectedMoves.length < 4) {
      if (!usedMoveNames.has('metronome')) {
          selectedMoves.push({
              name: 'metronome', displayName: 'Metrônomo', power: 0, type: 'normal', accuracy: 100,
              isStatus: true, damageClass: 'status', description: 'Usa um movimento aleatório.',
              uses: 10, maxUses: 10, priority: 0
          });
      }
  }

  // Calculate PP
  allMoves.forEach(m => {
      if (m.name === 'struggle') m.maxUses = 99;
      else if (m.isStatus) m.maxUses = 8;
      else if (m.power <= 40) m.maxUses = 12;
      else if (m.power <= 60) m.maxUses = 10;
      else if (m.power <= 80) m.maxUses = 8;
      else if (m.power <= 100) m.maxUses = 6;
      else if (m.power <= 120) m.maxUses = 4;
      else m.maxUses = 2;
      m.uses = m.maxUses;
  });

  // Apply manual PP to manual moves if added
  selectedMoves.forEach(m => {
      if (m.uses === 0) {
          if (m.name === 'struggle') { m.uses = 100; m.maxUses = 100; }
          else if (m.name === 'tackle') { m.uses = 35; m.maxUses = 35; }
          else if (m.name === 'metronome') { m.uses = 10; m.maxUses = 10; }
          else if (m.isStatus) m.maxUses = 8;
          else if (m.power <= 40) m.maxUses = 12;
          else if (m.power <= 60) m.maxUses = 10;
          else if (m.power <= 80) m.maxUses = 8;
          else if (m.power <= 100) m.maxUses = 6;
          else if (m.power <= 120) m.maxUses = 4;
          else m.maxUses = 2;
          
          if (m.uses === 0) m.uses = m.maxUses;
      }
  });

  let gender: 'male' | 'female' | 'genderless' = 'male';
  const speciesLower = data.species.name.toLowerCase();
  const nameLower = data.name.toLowerCase();

  if (nameLower.endsWith('-male')) gender = 'male';
  else if (nameLower.endsWith('-female')) gender = 'female';
  else if (ALWAYS_GENDERLESS.includes(speciesLower) || ALWAYS_GENDERLESS.includes(nameLower)) gender = 'genderless';
  else if (ALWAYS_FEMALE.includes(speciesLower) || ALWAYS_FEMALE.includes(nameLower)) gender = 'female';
  else if (ALWAYS_MALE.includes(speciesLower) || ALWAYS_MALE.includes(nameLower)) gender = 'male';
  else gender = Math.random() < 0.5 ? 'male' : 'female';

  // --- ABILITY SELECTION ---
  // Captura todas as habilidades possíveis
  const availableAbilities = data.abilities.map((a: any) => a.ability.name);
  
  // Seleciona uma aleatória por padrão, ou a primeira (ou 'unknown' como fallback)
  const selectedAbility = availableAbilities.length > 0 
      ? availableAbilities[Math.floor(Math.random() * availableAbilities.length)] 
      : (data.abilities[0]?.ability?.name || 'unknown');

  // IVs
  const ivs: PokemonStats = { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 };
  if (randomIvs) {
      ivs.hp = getRandomInt(0, 31);
      ivs.attack = getRandomInt(0, 31);
      ivs.defense = getRandomInt(0, 31);
      ivs.spAttack = getRandomInt(0, 31);
      ivs.spDefense = getRandomInt(0, 31);
      ivs.speed = getRandomInt(0, 31);
  }
  
  // EVs
  let evs: PokemonStats = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
  
  if (isRandomMode) {
      const statsList: (keyof PokemonStats)[] = ['hp', 'attack', 'defense', 'spAttack', 'spDefense', 'speed'];
      
      const baseAtk = getStat(data, 'attack');
      const baseSpA = getStat(data, 'special-attack');
      const baseSpe = getStat(data, 'speed');
      const baseDef = getStat(data, 'defense');
      const baseSpD = getStat(data, 'special-defense');
      
      const isPhysical = baseAtk >= baseSpA;
      
      const weights: Record<keyof PokemonStats, number> = {
          hp: 60,
          attack: isPhysical ? baseAtk * 2.5 : 0,
          defense: baseDef,
          spAttack: !isPhysical ? baseSpA * 2.5 : 0,
          spDefense: baseSpD,
          speed: baseSpe * 1.5
      };

      if (baseSpe > 100) {
          weights.speed *= 1.5;
          weights.hp *= 0.5;
      } else if (baseSpe < 60) {
          weights.hp *= 1.5;
          weights.speed *= 0.2;
      }

      let remainingEVs = 508;
      const chunkSize = 4;

      while (remainingEVs >= chunkSize) {
          let totalWeight = 0;
          const candidates: (keyof PokemonStats)[] = [];
          
          statsList.forEach(stat => {
              if (evs[stat] < 252) {
                  candidates.push(stat);
                  totalWeight += weights[stat];
              }
          });

          if (candidates.length === 0) break;

          let random = Math.random() * totalWeight;
          for (const stat of candidates) {
              random -= weights[stat];
              if (random <= 0) {
                  const amount = Math.min(chunkSize, 252 - evs[stat], remainingEVs);
                  evs[stat] += amount;
                  remainingEVs -= amount;
                  break;
              }
          }
      }
  }

  const natureKeys = Object.keys(NATURES);
  const nature = natureKeys[Math.floor(Math.random() * natureKeys.length)];
  
  // Nível: Aleatório (20-100) ou Fixo (50)
  const level = randomLevels ? getRandomInt(20, 100) : 50;

  const baseHpVal = getStat(data, 'hp');
  const maxHP = calculateMaxHP(baseHpVal, ivs.hp, evs.hp, level);

  return {
    id: data.id,
    name: formatPokemonName(data.name),
    speciesId: data.name,
    hp: maxHP,
    maxHP: maxHP,
    spriteUrl,
    backSpriteUrl,
    pixelSpriteUrl,
    fallbackUrls: [data.sprites.front_default],
    // --- ÁUDIO (CRIES) ---
    cries: {
        latest: data.cries?.latest,
        legacy: data.cries?.legacy
    },
    attackStat: getStat(data, 'attack'),
    defenseStat: getStat(data, 'defense'),
    spAttackStat: getStat(data, 'special-attack'),
    spDefenseStat: getStat(data, 'special-defense'),
    speedStat: getStat(data, 'speed'),
    ivs,
    evs,
    nature,
    level,
    baseHp: baseHpVal, // Armazena base HP para recálculos
    weight: data.weight || 500,
    ability: selectedAbility,
    possibleAbilities: availableAbilities, // Armazena todas as habilidades possíveis
    heldItem,
    consumedItem: null,
    hadItem: !!heldItem,
    lockedMove: null,
    chargingMove: null,
    mustRecharge: false,
    moves: selectedMoves,
    movePool: allMoves,
    movesUsed: [],
    types,
    teraType,
    isTerastallized: false,
    megaProfile, // Add Mega Profile
    isMega: false, // Init as false
    gender, 
    isFainted: false,
    isFlinched: false,
    turnsActive: 0,
    statusEffects: {},
    statStages: { accuracy: 0, evasion: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 },
    isShiny
  };
}

export async function fetchTeam(
  count: number,
  mode: 'manual' | 'random' | 'builder',
  input: string,
  randomIvs: boolean = true,
  randomLevels: boolean = false,
  megaEnabled: boolean = false,
  itemsEnabled: boolean = true
): Promise<Pokemon[]> {
    if (mode === 'random') {
        const promises: Promise<Pokemon>[] = [];
        const usedIdentifiers = new Set<string | number>();
        let attempts = 0;
        const maxAttempts = count * 10; // Safety limit to avoid infinite loops

        // Blacklist de formas que só existem em batalha e não devem ser geradas inicialmente
        const BATTLE_ONLY_FORMS = [
            'palafin-hero',
            'meloetta-pirouette',
            'aegislash-blade',
            'wishiwashi-school',
            'mimikyu-busted',
            'eiscue-noice',
            'morpeko-hangry',
            'eternatus-eternamax',
            'terapagos-terastal',
            'terapagos-stellar'
        ];

        while (promises.length < count && attempts < maxAttempts) {
            let identifier: string | number = getRandomInt(1, MAX_POKEMON_ID);
            if (POKEMON_LIST && POKEMON_LIST.length > 0) {
                 identifier = POKEMON_LIST[Math.floor(Math.random() * POKEMON_LIST.length)];
            }
            
            // Filtra formas exclusivas de batalha
            if (typeof identifier === 'string' && BATTLE_ONLY_FORMS.includes(identifier)) {
                attempts++;
                continue;
            }

            if (!usedIdentifiers.has(identifier)) {
                usedIdentifiers.add(identifier);
                promises.push(fetchPokemonData(identifier, true, randomIvs, randomLevels, megaEnabled, itemsEnabled));
            }
            attempts++;
        }
        
        return Promise.all(promises);
    } else {
        const names = input.split(',').map(s => s.trim()).filter(s => s.length > 0);
        // If manual/builder, we fetch exactly what is asked.
        const promises = names.map(name => fetchPokemonData(name, false, randomIvs, randomLevels, megaEnabled, itemsEnabled));
        return Promise.all(promises);
    }
}


import { Move } from '../../types';
import { MOVE_EFFECTS, VARIABLE_POWER_MOVES, DAMAGE_RECOIL_MOVES, HP_RECOIL_MOVES, MULTI_HIT_MOVES } from '../../data/moves';
import { MOVE_TRANSLATIONS, MOVE_DESCRIPTIONS } from '../../data/translations';
import { TRANSLATION_REGEX } from '../../data/general';
import { getFromCache, saveToCache } from './cache';

export const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';

const POKEAPI_NAME_MAP: Record<string, string> = {
  'necrozma-dusk-mane': 'necrozma-dusk',
  'necrozma-dawn-wings': 'necrozma-dawn',
  'cherrim-sunshine': 'cherrim-sunny',
  'darmanitan-standard-zen': 'darmanitan-zen',
  'darmanitan-galar-zen': 'darmanitan-galar-zen',
  'calyrex-ice-rider': 'calyrex-ice',
  'calyrex-shadow-rider': 'calyrex-shadow',
  'tauros-paldea-combat': 'tauros-paldea-combat-breed',
  'tauros-paldea-blaze': 'tauros-paldea-blaze-breed',
  'tauros-paldea-aqua': 'tauros-paldea-aqua-breed',
  'basculegion-f': 'basculegion-female',
  'oinkologne-f': 'oinkologne-female',
  'meowstic-f': 'meowstic-female',
  'indeedee-f': 'indeedee-female',
  'zygarde-10%': 'zygarde-10',
  'zygarde-complete': 'zygarde-complete', // A PokeAPI base usa zygarde-50 para a forma base, valide se complete existe como zygarde-complete
  'minior-meteor': 'minior-red-meteor', // PokeAPI exige a cor
  'urshifu-single-strike': 'urshifu-single-strike',
  'urshifu-rapid-strike': 'urshifu-rapid-strike',
  'giratina-origin': 'giratina-origin',
  'keldeo-resolute': 'keldeo-resolute',
  'meloetta-pirouette': 'meloetta-pirouette',
  'aegislash-blade': 'aegislash-blade',
  'mimikyu-busted': 'mimikyu-busted',
  'cramorant-gulping': 'cramorant-gulping',
  'cramorant-gorging': 'cramorant-gorging',
  'zacian-crowned': 'zacian-crowned',
  'zamazenta-crowned': 'zamazenta-crowned',
  'tornadus-therian': 'tornadus-therian',
  'thundurus-therian': 'thundurus-therian',
  'landorus-therian': 'landorus-therian',
  'enamorus-therian': 'enamorus-therian',
  'deoxys-attack': 'deoxys-attack',
  'deoxys-defense': 'deoxys-defense',
  'deoxys-speed': 'deoxys-speed',
  'wormadam-sandy': 'wormadam-sandy',
  'wormadam-trash': 'wormadam-trash',
  'shaymin-sky': 'shaymin-sky',
  'hoopa-unbound': 'hoopa-unbound',
  'lycanroc-midnight': 'lycanroc-midnight',
  'lycanroc-dusk': 'lycanroc-dusk',
  'wishiwashi-school': 'wishiwashi-school',
  'toxtricity-low-key': 'toxtricity-low-key',
  'eiscue-noice': 'eiscue-noice',
  'morpeko-hangry': 'morpeko-hangry',
  'palafin-hero': 'palafin-hero',
  'gimmighoul-roaming': 'gimmighoul-roaming',
  'ogerpon-wellspring': 'ogerpon-wellspring-mask',
  'ogerpon-hearthflame': 'ogerpon-hearthflame-mask',
  'ogerpon-cornerstone': 'ogerpon-cornerstone-mask',
  'terapagos-terastal': 'terapagos-terastal',
  'terapagos-stellar': 'terapagos-stellar',
  'ursaluna-bloodmoon': 'ursaluna-bloodmoon',
  'dudunsparce-two-segment': 'dudunsparce',
  'dudunsparce-three-segment': 'dudunsparce-three-segment',
  'maushold-family-of-four': 'maushold',
  'maushold-family-of-three': 'maushold-family-of-three',
  'corsola-galar': 'corsola-galar',
  'yamask-galar': 'yamask-galar',
  'stunfisk-galar': 'stunfisk-galar',
  'slowpoke-galar': 'slowpoke-galar',
  'slowbro-galar': 'slowbro-galar',
  'slowking-galar': 'slowking-galar',
  'articuno-galar': 'articuno-galar',
  'zapdos-galar': 'zapdos-galar',
  'moltres-galar': 'moltres-galar',
  'floette-eternal': 'floette-eternal',
  'pikachu-original-cap': 'pikachu-original-cap',
  'pikachu-hoenn-cap': 'pikachu-hoenn-cap',
  'pikachu-sinnoh-cap': 'pikachu-sinnoh-cap',
  'pikachu-unova-cap': 'pikachu-unova-cap',
  'pikachu-kalos-cap': 'pikachu-kalos-cap',
  'pikachu-alola-cap': 'pikachu-alola-cap',
  'pikachu-partner-cap': 'pikachu-partner-cap',
  'pikachu-world-cap': 'pikachu-world-cap',
  'pyroar-m': 'pyroar',
  'pyroar-f': 'pyroar-female',
  'meowstic-m': 'meowstic-male'
};

function translateDescription(text: string) {
    let t = text;
    TRANSLATION_REGEX.forEach((item: {p: RegExp, r: string}) => {
        t = t.replace(item.p, item.r);
    });
    return t.charAt(0).toUpperCase() + t.slice(1);
}

export async function fetchRawPokemonData(identifier: string | number): Promise<any> {
  const cleanId = String(identifier).toLowerCase().trim();
  const cacheKey = `pokemon_raw_${cleanId}`;
  let data = await getFromCache<any>(cacheKey);

  // Validate cached data to ensure it's a valid Pokémon object
  if (!data || !data.types || !data.stats || !data.abilities) {
      const apiName = POKEAPI_NAME_MAP[cleanId] || cleanId;
      let url = `${POKEAPI_BASE_URL}${apiName}`;
      let response = await fetch(url);
      
      // MECANISMO DE FALLBACK (RETRY INTELIGENTE)
      if (!response.ok && cleanId.includes('-')) {
          const baseName = cleanId.split('-')[0];
          url = `${POKEAPI_BASE_URL}${baseName}`;
          response = await fetch(url);
      }

      if (!response.ok) throw new Error(`Pokémon ${identifier} not found`);
      
      data = await response.json();
      if (!data || !data.types || !data.stats || !data.abilities) {
          throw new Error(`Invalid data received from PokeAPI for ${identifier}`);
      }
      await saveToCache(cacheKey, data);
  }
  return data;
}

export async function fetchMoveDetails(moveUrl: string): Promise<Move | null> {
  const cacheKey = `move_details_${moveUrl}`;
  const cachedMove = await getFromCache<Move>(cacheKey);
  if (cachedMove && cachedMove.name) {
      // Force update translations from current dictionary to fix cached untranslated moves
      if (MOVE_TRANSLATIONS[cachedMove.name]) {
          cachedMove.displayName = MOVE_TRANSLATIONS[cachedMove.name];
      }
      if (MOVE_DESCRIPTIONS[cachedMove.name]) {
          cachedMove.description = MOVE_DESCRIPTIONS[cachedMove.name];
      }
      return cachedMove;
  }

  try {
    const response = await fetch(moveUrl);
    if (!response.ok) return null;
    const data = await response.json();

    let power = data.power;
    if (!power && VARIABLE_POWER_MOVES[data.name]) {
        power = VARIABLE_POWER_MOVES[data.name];
    }
    // Fallback power to 0 if not defined
    if (!power) power = 0;

    // RELAXED FILTERING: We no longer return null for missing effects/power.
    // We accept almost any move to ensure movesets are filled.

    let description = MOVE_DESCRIPTIONS[data.name];
    
    if (!description) {
        let flavorText = "Sem descrição.";
        if (data.flavor_text_entries) {
          const entry = data.flavor_text_entries.find((e: any) => e.language?.name === 'en');
          if (entry) flavorText = entry.flavor_text.replace(/\n|\f/g, ' ');
        }
        description = translateDescription(flavorText);
    }

    const nameEnglish = data.names.find((n: any) => n.language?.name === 'en')?.name || data.name;
    const displayName = MOVE_TRANSLATIONS[data.name] || nameEnglish;

    let recoilType: 'damage' | 'max-hp' | undefined;
    let recoilValue: number | undefined;

    if (DAMAGE_RECOIL_MOVES[data.name]) {
        recoilType = 'damage';
        recoilValue = DAMAGE_RECOIL_MOVES[data.name];
    } else if (HP_RECOIL_MOVES[data.name]) {
        recoilType = 'max-hp';
        recoilValue = HP_RECOIL_MOVES[data.name];
    }

    const hitData = MULTI_HIT_MOVES[data.name];

    const moveObj: Move = {
      name: data.name,
      displayName: displayName,
      power: power || 0,
      type: data.type.name,
      accuracy: data.accuracy || 100, // Default to 100 if null (common for status moves)
      isStatus: data.damage_class?.name === 'status',
      damageClass: data.damage_class?.name,
      effect: MOVE_EFFECTS[data.name], // Can be undefined, handled by engine as generic move
      description,
      uses: 0, 
      maxUses: 0,
      priority: data.priority,
      recoilType,
      recoilValue,
      minHits: hitData ? hitData.min : undefined,
      maxHits: hitData ? hitData.max : undefined
    };

    await saveToCache(cacheKey, moveObj);
    return moveObj;
  } catch {
    return null;
  }
}

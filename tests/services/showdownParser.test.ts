import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchMoveDetails, fetchRawPokemonData } from '../../services/api/client';
import { exportShowdownTeam, parseShowdownTeam, ShowdownParseError } from '../../services/showdownParser';
import { calculateStat } from '../../services/engine/handlers/statCalculator';
import type { Move } from '../../types';

vi.mock('../../services/api/client', () => ({
    fetchRawPokemonData: vi.fn(),
    fetchMoveDetails: vi.fn(),
    POKEAPI_NAME_MAP: {
        'necrozma-dusk-mane': 'necrozma-dusk'
    }
}));

const mockFetchRawPokemonData = vi.mocked(fetchRawPokemonData);
const mockFetchMoveDetails = vi.mocked(fetchMoveDetails);

interface StatSource {
    hp: number;
    attack: number;
    defense: number;
    'special-attack': number;
    'special-defense': number;
    speed: number;
}

const createPokeapiPokemon = (options: {
    name: string;
    id?: number;
    types?: string[];
    abilities?: string[];
    stats?: Partial<StatSource>;
}) => {
    const stats: StatSource = {
        hp: 78,
        attack: 84,
        defense: 78,
        'special-attack': 109,
        'special-defense': 85,
        speed: 100,
        ...options.stats
    };

    return {
        id: options.id ?? 6,
        name: options.name,
        weight: 905,
        types: (options.types ?? ['fire', 'flying']).map(type => ({ type: { name: type } })),
        stats: Object.entries(stats).map(([statName, base]) => ({ base_stat: base, stat: { name: statName } })),
        abilities: (options.abilities ?? ['blaze', 'solar-power']).map(ability => ({ ability: { name: ability } })),
        held_items: [],
        cries: { latest: 'cry-latest', legacy: 'cry-legacy' },
        sprites: {
            front_default: 'front.png',
            back_default: 'back.png',
            front_shiny: 'front-shiny.png',
            back_shiny: 'back-shiny.png',
            other: { 'official-artwork': { front_default: 'art.png', front_shiny: 'art-shiny.png' } }
        },
        species: { name: options.name },
        moves: []
    };
};

const POKEAPI_POKEMON: Record<string, ReturnType<typeof createPokeapiPokemon>> = {
    charizard: createPokeapiPokemon({ name: 'charizard', id: 6 }),
    mimikyu: createPokeapiPokemon({
        name: 'mimikyu-disguised',
        id: 778,
        types: ['ghost', 'fairy'],
        abilities: ['disguise'],
        stats: { hp: 55, attack: 90, defense: 80, 'special-attack': 50, 'special-defense': 105, speed: 96 }
    }),
    flabebe: createPokeapiPokemon({
        name: 'flabebe',
        id: 669,
        types: ['fairy'],
        abilities: ['flower-veil', 'symbiosis'],
        stats: { hp: 44, attack: 38, defense: 39, 'special-attack': 61, 'special-defense': 79, speed: 42 }
    })
};

const POKEAPI_MOVES: Record<string, { power: number; type: string; pp: number; isStatus?: boolean; damageClass?: string }> = {
    flamethrower: { power: 90, type: 'fire', pp: 15, damageClass: 'special' },
    'dragon-claw': { power: 80, type: 'dragon', pp: 15 },
    roost: { power: 0, type: 'flying', pp: 5, isStatus: true, damageClass: 'status' },
    'air-slash': { power: 75, type: 'flying', pp: 15, damageClass: 'special' },
    'shadow-claw': { power: 70, type: 'ghost', pp: 15 },
    'play-rough': { power: 90, type: 'fairy', pp: 10 },
    'moonblast': { power: 95, type: 'fairy', pp: 15, damageClass: 'special' },
    'dazzling-gleam': { power: 80, type: 'fairy', pp: 10, damageClass: 'special' },
    'protect': { power: 0, type: 'normal', pp: 10, isStatus: true, damageClass: 'status' }
};

const toMove = (slug: string): Move | null => {
    const definition = POKEAPI_MOVES[slug];
    if (!definition) return null;
    return {
        name: slug,
        displayName: slug,
        power: definition.power,
        type: definition.type,
        accuracy: 100,
        isStatus: definition.isStatus ?? false,
        damageClass: definition.damageClass ?? 'physical',
        description: '',
        uses: 0,
        maxUses: 0,
        pp: definition.pp,
        priority: 0
    };
};

beforeEach(() => {
    mockFetchRawPokemonData.mockReset();
    mockFetchMoveDetails.mockReset();

    mockFetchRawPokemonData.mockImplementation(async (identifier: string | number) => {
        const payload = POKEAPI_POKEMON[String(identifier).toLowerCase()];
        if (!payload) throw new Error(`Pokémon ${identifier} not found`);
        return structuredClone(payload);
    });

    mockFetchMoveDetails.mockImplementation(async (url: string) => {
        const slug = url.replace(/\/$/, '').split('/').pop() ?? '';
        return toMove(slug);
    });
});

const BASIC_SET = `Charizard (M) @ Leftovers
Ability: Blaze
EVs: 252 Atk / 4 Def / 252 Spe
Adamant Nature
- Flamethrower
- Dragon Claw`;

const FULL_SET = `Charizard (M) @ Leftovers
Ability: Blaze
Level: 50
Shiny: Yes
Tera Type: Fire
EVs: 252 SpA / 4 SpD / 252 Spe
Timid Nature
IVs: 0 Atk
- Flamethrower
- Air Slash
- Roost
- Dragon Claw`;

describe('importação Showdown — parser endurecido', () => {
    it('importa um set completo básico com item, habilidade, natureza e golpes', async () => {
        const team = await parseShowdownTeam(BASIC_SET);

        expect(team).toHaveLength(1);
        const [charizard] = team;
        expect(charizard.speciesId).toBe('charizard');
        expect(charizard.name).toBe('Charizard');
        expect(charizard.level).toBe(100);
        expect(charizard.heldItem).toBe('leftovers');
        expect(charizard.hadItem).toBe(true);
        expect(charizard.ability).toBe('blaze');
        expect(charizard.nature).toBe('adamant');
        expect(charizard.gender).toBe('male');
        expect(charizard.moves.map(move => move.name)).toEqual(['flamethrower', 'dragon-claw']);
        expect(charizard.instanceId).toBe('p1-slot-0');
    });

    it('preserva Tera Type e Shiny na importação e na exportação', async () => {
        const [charizard] = await parseShowdownTeam(FULL_SET);

        expect(charizard.isShiny).toBe(true);
        expect(charizard.teraType).toBe('fire');

        const text = exportShowdownTeam([charizard]);
        expect(text).toContain('Shiny: Yes');
        expect(text).toContain('Tera Type: Fire');
        expect(text).toContain('Level: 50');
    });

    it('recalcula HP pelo caminho canônico e os demais atributos com nível, EVs, IVs e Natureza', async () => {
        const [charizard] = await parseShowdownTeam(BASIC_SET);

        // Nível 100, EVs 252 Atk / 4 Def / 252 Spe, IVs 31, Natureza Adamant.
        expect(charizard.maxHP).toBe(297);
        expect(charizard.hp).toBe(297);
        expect(calculateStat(charizard, 'attack', 'none')).toBe(293);
        expect(calculateStat(charizard, 'defense', 'none')).toBe(193);
        expect(calculateStat(charizard, 'spAttack', 'none')).toBe(228);
        expect(calculateStat(charizard, 'speed', 'none')).toBe(299);

        // Nível 50 e IV 0 no Ataque precisam mudar os valores:
        const [weaker] = await parseShowdownTeam(`Charizard (M) @ Leftovers
Ability: Blaze
Level: 50
EVs: 252 Atk
Adamant Nature
IVs: 0 Atk
- Flamethrower`);
        expect(weaker.maxHP).toBe(153);
        expect(calculateStat(weaker, 'attack', 'none')).toBe(132);
        expect(calculateStat(weaker, 'speed', 'none')).toBe(120);
    });

    it('inicia os golpes com PP cheio vindo da PokeAPI', async () => {
        const [charizard] = await parseShowdownTeam(FULL_SET);

        const byName = new Map(charizard.moves.map(move => [move.name, move]));
        expect(byName.get('flamethrower')).toMatchObject({ uses: 15, maxUses: 15 });
        expect(byName.get('roost')).toMatchObject({ uses: 5, maxUses: 5 });
        expect(charizard.moves.every(move => move.uses > 0 && move.uses === move.maxUses)).toBe(true);
        // O pool de golpes acompanha os mesmos objetos, como na fábrica de equipes.
        expect(charizard.movePool).toBe(charizard.moves);
    });

    it('normaliza apelidos, formas, gênero e acentos com os mapas existentes', async () => {
        const [mimikyu] = await parseShowdownTeam(`Acerola (Mimikyu) (F) @ Life Orb
Ability: Disguise
- Shadow Claw
- Play Rough`);

        expect(mimikyu.speciesId).toBe('mimikyu-disguised');
        expect(mimikyu.name).toBe('Acerola');
        expect(mimikyu.gender).toBe('female');
        expect(mimikyu.heldItem).toBe('life-orb');

        const [flabebe] = await parseShowdownTeam(`Flabébé @ Leftovers
Ability: Flower Veil
- Dazzling Gleam`);

        expect(flabebe.speciesId).toBe('flabebe');
        expect(flabebe.ability).toBe('flower-veil');
    });

    it('rejeita nível, EVs totais e IVs fora do limite e mais de 4 golpes', async () => {
        await expect(parseShowdownTeam(`Charizard
Level: 101
- Flamethrower`)).rejects.toMatchObject({ code: 'INVALID_LEVEL' });

        await expect(parseShowdownTeam(`Charizard
Level: 0
- Flamethrower`)).rejects.toMatchObject({ code: 'INVALID_LEVEL' });

        await expect(parseShowdownTeam(`Charizard
EVs: 256 Atk
- Flamethrower`)).rejects.toMatchObject({ code: 'INVALID_EV' });

        await expect(parseShowdownTeam(`Charizard
IVs: 32 Atk
- Flamethrower`)).rejects.toMatchObject({ code: 'INVALID_IV' });

        await expect(parseShowdownTeam(`Charizard
EVs: 252 HP / 252 Atk / 4 Def / 4 Spe
- Flamethrower`)).rejects.toMatchObject({ code: 'EV_TOTAL_EXCEEDED' });

        await expect(parseShowdownTeam(`Charizard
- Flamethrower
- Dragon Claw
- Air Slash
- Roost
- Protect`)).rejects.toMatchObject({ code: 'TOO_MANY_MOVES' });
    });

    it('rejeita espécie e golpe inexistentes sem importar nada parcialmente', async () => {
        await expect(parseShowdownTeam(`Charizard @ Leftovers
- Flamethrower

Missingno @ Leftovers
- Flamethrower`)).rejects.toBeInstanceOf(ShowdownParseError);

        await expect(parseShowdownTeam(`Charizard @ Leftovers
- Flamethrower

Missingno @ Leftovers
- Flamethrower`)).rejects.toThrow(/espécie não encontrada/i);

        await expect(parseShowdownTeam(`Charizard @ Leftovers
- Golpe Inexistente`)).rejects.toMatchObject({ code: 'MOVE_NOT_FOUND' });

        // A PokeAPI cai para a espécie base quando a forma não existe: isso não pode passar em silêncio.
        mockFetchRawPokemonData.mockResolvedValueOnce(
            structuredClone(POKEAPI_POKEMON.charizard)
        );
        await expect(parseShowdownTeam(`Charizard-Fake @ Leftovers
- Flamethrower`)).rejects.toThrow(/não existe/i);
    });

    it('valida a quantidade exata de Pokémon do modo Showdown', async () => {
        const twoBlocks = `${BASIC_SET}\n\n${BASIC_SET}`;

        await expect(parseShowdownTeam(twoBlocks, { expectedCount: 3 })).rejects.toMatchObject({
            code: 'TEAM_SIZE_MISMATCH'
        });
        expect((await parseShowdownTeam(twoBlocks, { expectedCount: 2 }))).toHaveLength(2);

        const three = `${BASIC_SET}\n\n${BASIC_SET}\n\n${BASIC_SET}`;
        expect(await parseShowdownTeam(three, { expectedCount: 3 })).toHaveLength(3);
    });

    it('gera instanceId único para duplicatas e respeita o lado informado', async () => {
        const duplicates = `${BASIC_SET}\n\n${BASIC_SET}\n\n${BASIC_SET}`;

        const team = await parseShowdownTeam(duplicates, { expectedCount: 3, playerNum: 2 });
        const ids = team.map(pokemon => pokemon.instanceId);
        expect(ids).toEqual(['p2-slot-0', 'p2-slot-1', 'p2-slot-2']);
        expect(new Set(ids).size).toBe(3);
    });

    it('exporta e reimporta preservando os dados semânticos (ida e volta)', async () => {
        const [original] = await parseShowdownTeam(FULL_SET);

        const text = exportShowdownTeam([original]);
        expect(text).toContain('Charizard (M) @ Leftovers');
        expect(text).toContain('Ability: Blaze');
        expect(text).toContain('Timid Nature');
        expect(text).toContain('EVs: 252 SpA / 4 SpD / 252 Spe');
        expect(text).toContain('IVs: 0 Atk');
        expect(text).toContain('- Roost');

        const [restored] = await parseShowdownTeam(text);
        expect(restored.speciesId).toBe(original.speciesId);
        expect(restored.name).toBe(original.name);
        expect(restored.level).toBe(original.level);
        expect(restored.heldItem).toBe(original.heldItem);
        expect(restored.ability).toBe(original.ability);
        expect(restored.nature).toBe(original.nature);
        expect(restored.teraType).toBe(original.teraType);
        expect(restored.isShiny).toBe(original.isShiny);
        expect(restored.gender).toBe(original.gender);
        expect(restored.evs).toEqual(original.evs);
        expect(restored.ivs).toEqual(original.ivs);
        expect(restored.moves.map(move => move.name)).toEqual(original.moves.map(move => move.name));
        expect(restored.maxHP).toBe(original.maxHP);
    });

    it('mantém a exportação compacta e não altera a equipe nem o JSON interno', async () => {
        const [charizard] = await parseShowdownTeam(`Charizard @ Leftovers
Ability: Blaze
EVs: 252 Atk
- Flamethrower`);

        const snapshot = JSON.stringify(charizard);
        const text = exportShowdownTeam([charizard]);

        expect(text).not.toContain('IVs:');
        expect(text).toContain('EVs: 252 Atk');
        expect(text).not.toContain('Level:');
        expect(text).not.toContain('Shiny:');
        expect(JSON.stringify(charizard)).toBe(snapshot);

        // O fluxo JSON interno continua serializando/reconstruindo a equipe sem perdas.
        const restored = JSON.parse(JSON.stringify([charizard]));
        expect(restored[0].speciesId).toBe('charizard');
        expect(restored[0].moves[0].name).toBe('flamethrower');
    });
});
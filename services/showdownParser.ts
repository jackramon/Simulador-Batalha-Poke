import { Pokemon, Move, PokemonStats } from '../types';
import { fetchPokemonData, formatPokemonName } from './api/factory';
import { fetchMoveDetails, POKEAPI_NAME_MAP } from './api/client';
import { calculateMaxHP } from './engine/handlers/statCalculator';
import { NATURES } from '../data/natures';
import { ITEMS_DATA } from '../data/items';
import {
    POKEMON_NAME_TRANSLATIONS,
    NAME_SUFFIX_TRANSLATIONS,
    ALWAYS_MALE,
    ALWAYS_FEMALE,
    ALWAYS_GENDERLESS
} from '../data/pokemon';
import { TYPE_NAMES_PT } from '../data/types';
import { normalizeTeamInstanceIds } from '../utils/pokemonIdentity';

/**
 * Importação/exportação de equipes no formato Showdown (texto).
 *
 * Regras da importação:
 * - Nenhuma equipe parcial é aceita: o primeiro problema interrompe a importação com mensagem específica.
 * - Os seis atributos seguem o caminho canônico (`fetchPokemonData` + `calculateMaxHP`); nenhuma fórmula é duplicada.
 * - O PP inicial vem do campo `pp` da PokeAPI, com usos cheios.
 * - A quantidade é validada exatamente contra o tamanho de equipe escolhido na UI.
 */

export type ShowdownErrorCode =
    | 'EMPTY_TEAM'
    | 'INVALID_BLOCK'
    | 'INVALID_LINE'
    | 'INVALID_LEVEL'
    | 'INVALID_EV'
    | 'INVALID_IV'
    | 'EV_TOTAL_EXCEEDED'
    | 'TOO_MANY_MOVES'
    | 'NO_MOVES'
    | 'UNKNOWN_NATURE'
    | 'UNKNOWN_TERA_TYPE'
    | 'UNKNOWN_ITEM'
    | 'UNKNOWN_ABILITY'
    | 'SPECIES_NOT_FOUND'
    | 'MOVE_NOT_FOUND'
    | 'TEAM_SIZE_MISMATCH';

export class ShowdownParseError extends Error {
    readonly code: ShowdownErrorCode;

    constructor(code: ShowdownErrorCode, message: string) {
        super(message);
        this.name = 'ShowdownParseError';
        this.code = code;
    }
}

export interface ShowdownParseOptions {
    /** Tamanho de equipe selecionado na UI; a importação exige exatamente essa quantidade. */
    expectedCount?: number;
    /** Lado da batalha, usado apenas para gerar `instanceId` únicos pela normalização existente. */
    playerNum?: 1 | 2;
}

interface ParsedSet {
    label: string;
    species: string;
    speciesLabel: string;
    nickname?: string;
    gender?: Pokemon['gender'];
    item: string | null;
    ability?: string;
    level: number;
    shiny: boolean;
    evs: PokemonStats;
    ivs: PokemonStats;
    nature: string;
    teraType?: string;
    moves: string[];
}

const STAT_KEYS: Array<[keyof PokemonStats, string]> = [
    ['hp', 'HP'],
    ['attack', 'Atk'],
    ['defense', 'Def'],
    ['spAttack', 'SpA'],
    ['spDefense', 'SpD'],
    ['speed', 'Spe']
];

const STAT_LABELS: Record<string, keyof PokemonStats> = {
    hp: 'hp',
    atk: 'attack',
    def: 'defense',
    spa: 'spAttack',
    spd: 'spDefense',
    spe: 'speed'
};

const MAX_EV_PER_STAT = 255;
const MAX_EV_TOTAL = 510;
const MAX_IV = 31;

// Metadados aceitos pelo formato Showdown que não alteram a batalha neste simulador.
const IGNORED_METADATA = /^(happiness|ball|dynamax level|gigantamax|hidden power):/i;

const emptyStats = (value: number): PokemonStats => ({
    hp: value,
    attack: value,
    defense: value,
    spAttack: value,
    spDefense: value,
    speed: value
});

/** Normaliza texto livre para o slug usado pelo simulador (minúsculas, sem acentos, hífens). */
const normalizeSlug = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-\s]/g, '')
        .trim()
        .replace(/\s+/g, '-');

/** Converte nomes exibidos (PT-BR ou slugs) para o nome de espécie da PokeAPI. */
function reverseFormatPokemonName(name: string): string {
    let lowerName = name.toLowerCase().trim();

    // Remove sufixos de gênero que possam ter sido colados ao nome
    lowerName = lowerName.replace(/\s*\(m\)$/i, '').replace(/\s*\(f\)$/i, '').replace(/\s*\(n\)$/i, '');

    // Traduções diretas (ex.: "Presa Grande" -> great-tusk)
    for (const [key, value] of Object.entries(POKEMON_NAME_TRANSLATIONS)) {
        if (value.toLowerCase() === lowerName) return key;
    }

    let reversed = lowerName;

    // Sufixos de forma (ex.: "Charizard Mega X" -> charizard-mega-x)
    for (const [suffix, translation] of Object.entries(NAME_SUFFIX_TRANSLATIONS)) {
        if (!translation.trim()) continue; // Ignora traduções vazias para não dar match em tudo
        const lowerTranslation = translation.toLowerCase();
        if (reversed.endsWith(lowerTranslation)) {
            reversed = reversed.slice(0, -lowerTranslation.length) + suffix;
            break;
        }
    }

    return reversed
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-\s]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

function resolveGender(speciesId: string | undefined, displayName: string): Pokemon['gender'] {
    const candidates = new Set<string>();
    const addCandidate = (value?: string) => {
        if (!value) return;
        const slug = normalizeSlug(value);
        if (!slug) return;
        candidates.add(slug);
        const base = slug.split('-')[0];
        if (base) candidates.add(base);
    };

    addCandidate(speciesId);
    addCandidate(displayName);

    const matches = (list: string[]) => list.some(entry => candidates.has(entry));
    if (matches(ALWAYS_GENDERLESS)) return 'genderless';
    if (matches(ALWAYS_FEMALE)) return 'female';
    if (matches(ALWAYS_MALE)) return 'male';
    return 'male';
}

function parseStatsLine(
    rawValue: string,
    kind: 'evs' | 'ivs',
    label: string,
    maxValue: number
): Partial<PokemonStats> {
    const stats: Partial<PokemonStats> = {};
    const parts = rawValue.split('/').map(part => part.trim()).filter(part => part.length > 0);
    if (parts.length === 0) {
        throw new ShowdownParseError('INVALID_LINE', `${label}: linha de ${kind.toUpperCase()} vazia.`);
    }

    for (const part of parts) {
        const match = part.match(/^(\d+)\s+(HP|Atk|Def|SpA|SpD|Spe)$/i);
        if (!match) {
            throw new ShowdownParseError(
                'INVALID_LINE',
                `${label}: valor de ${kind.toUpperCase()} não reconhecido («${part}»). Use, por exemplo, "252 Atk / 4 Def".`
            );
        }

        const amount = parseInt(match[1], 10);
        const statKey = STAT_LABELS[match[2].toLowerCase()];
        if (!statKey) {
            throw new ShowdownParseError('INVALID_LINE', `${label}: atributo desconhecido em «${part}».`);
        }
        if (!Number.isInteger(amount) || amount < 0 || amount > maxValue) {
            throw new ShowdownParseError(
                kind === 'evs' ? 'INVALID_EV' : 'INVALID_IV',
                `${label}: ${kind.toUpperCase()} inválido (${amount} ${match[2]}). Use valores entre 0 e ${maxValue}.`
            );
        }
        stats[statKey] = amount;
    }

    return stats;
}

function splitHeaderAndItem(line: string): { header: string; itemLabel: string | null } {
    const atIndex = line.lastIndexOf('@');
    if (atIndex === -1) return { header: line.trim(), itemLabel: null };
    return {
        header: line.slice(0, atIndex).trim(),
        itemLabel: line.slice(atIndex + 1).trim() || null
    };
}

function parseBlock(block: string, blockNumber: number): ParsedSet {
    const lines = block
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const firstLine = lines[0];
    if (!firstLine) {
        throw new ShowdownParseError('INVALID_BLOCK', `Bloco ${blockNumber} está vazio.`);
    }

    const { header, itemLabel } = splitHeaderAndItem(firstLine);

    // Gênero pode aparecer no cabeçalho: "Apelido (Espécie) (M)"
    let gender: Pokemon['gender'] | undefined;
    let head = header;
    const genderMatch = head.match(/^(.*)\((M|F|N)\)\s*$/i);
    if (genderMatch) {
        head = genderMatch[1].trim();
        const marker = genderMatch[2].toUpperCase();
        gender = marker === 'F' ? 'female' : marker === 'N' ? 'genderless' : 'male';
    }

    let speciesLabel = head;
    let nickname: string | undefined;
    const speciesMatch = head.match(/^(.*?)\s*\(([^()]+)\)$/);
    if (speciesMatch && speciesMatch[1].trim()) {
        nickname = speciesMatch[1].trim();
        speciesLabel = speciesMatch[2].trim();
    }

    if (!speciesLabel) {
        throw new ShowdownParseError('INVALID_BLOCK', `Bloco ${blockNumber}: espécie ausente no cabeçalho «${firstLine}».`);
    }

    const species = reverseFormatPokemonName(speciesLabel);
    if (!species) {
        throw new ShowdownParseError('INVALID_BLOCK', `Bloco ${blockNumber}: espécie inválida «${speciesLabel}».`);
    }

    const label = nickname ? `${nickname} (${speciesLabel})` : speciesLabel;

    let item: string | null = null;
    if (itemLabel) {
        item = normalizeSlug(itemLabel);
        if (!item || !ITEMS_DATA[item]) {
            throw new ShowdownParseError(
                'UNKNOWN_ITEM',
                `${label}: item desconhecido «${itemLabel}». Remova o item ou use um item suportado pelo simulador.`
            );
        }
    }

    const parsed: ParsedSet = {
        label,
        species,
        speciesLabel,
        nickname,
        gender,
        item,
        level: 100,
        shiny: false,
        evs: emptyStats(0),
        ivs: emptyStats(MAX_IV),
        nature: 'hardy',
        moves: []
    };

    let evTotal = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith('-')) {
            const rawMove = line.replace(/^-\s*/, '').trim();
            if (!rawMove) {
                throw new ShowdownParseError('INVALID_BLOCK', `${label}: golpe vazio na linha «${line}».`);
            }
            const moveSlug = rawMove.toLowerCase().startsWith('hidden power')
                ? 'hidden-power'
                : normalizeSlug(rawMove);
            if (!moveSlug) {
                throw new ShowdownParseError('INVALID_BLOCK', `${label}: golpe inválido «${rawMove}».`);
            }
            parsed.moves.push(moveSlug);
            continue;
        }

        const abilityMatch = line.match(/^ability:\s*(.+)$/i);
        if (abilityMatch) {
            parsed.ability = normalizeSlug(abilityMatch[1]);
            if (!parsed.ability) {
                throw new ShowdownParseError('INVALID_BLOCK', `${label}: habilidade vazia.`);
            }
            continue;
        }

        const levelMatch = line.match(/^level:\s*(\S+)$/i);
        if (levelMatch) {
            const level = Number(levelMatch[1]);
            if (!Number.isInteger(level) || level < 1 || level > 100) {
                throw new ShowdownParseError(
                    'INVALID_LEVEL',
                    `${label}: nível inválido (${levelMatch[1]}). Use um número inteiro entre 1 e 100.`
                );
            }
            parsed.level = level;
            continue;
        }

        const shinyMatch = line.match(/^shiny:\s*(yes|no|true|false)$/i);
        if (shinyMatch) {
            parsed.shiny = /^(yes|true)$/i.test(shinyMatch[1]);
            continue;
        }

        const evsMatch = line.match(/^evs:\s*(.+)$/i);
        if (evsMatch) {
            const evs = parseStatsLine(evsMatch[1], 'evs', label, MAX_EV_PER_STAT);
            parsed.evs = { ...parsed.evs, ...evs };
            evTotal = (Object.values(parsed.evs) as number[]).reduce((total, value) => total + value, 0);
            continue;
        }

        const ivsMatch = line.match(/^ivs:\s*(.+)$/i);
        if (ivsMatch) {
            parsed.ivs = { ...parsed.ivs, ...parseStatsLine(ivsMatch[1], 'ivs', label, MAX_IV) };
            continue;
        }

        const teraMatch = line.match(/^tera type:\s*(.+)$/i);
        if (teraMatch) {
            const teraType = normalizeSlug(teraMatch[1]);
            if (!teraType || !TYPE_NAMES_PT[teraType]) {
                throw new ShowdownParseError(
                    'UNKNOWN_TERA_TYPE',
                    `${label}: Tera Type inválido «${teraMatch[1]}». Use um dos 18 tipos (ou Estelar/Stellar).`
                );
            }
            parsed.teraType = teraType;
            continue;
        }

        const natureMatch = line.match(/^(.+?)\s+nature$/i);
        if (natureMatch) {
            const nature = normalizeSlug(natureMatch[1]);
            if (!NATURES[nature]) {
                throw new ShowdownParseError(
                    'UNKNOWN_NATURE',
                    `${label}: natureza desconhecida «${natureMatch[1]}». Use uma natureza válida (ex.: Timid, Adamant).`
                );
            }
            parsed.nature = nature;
            continue;
        }

        if (IGNORED_METADATA.test(line)) continue;

        throw new ShowdownParseError(
            'INVALID_LINE',
            `${label}: linha não reconhecida «${line}». Golpes devem começar com "- " e dados como EVs, IVs, Natureza, Habilidade, Nível, Shiny e Tera Type precisam seguir o formato Showdown.`
        );
    }

    if (evTotal > MAX_EV_TOTAL) {
        throw new ShowdownParseError(
            'EV_TOTAL_EXCEEDED',
            `${label}: os EVs somam ${evTotal}, acima do máximo de ${MAX_EV_TOTAL}.`
        );
    }

    if (parsed.moves.length === 0) {
        throw new ShowdownParseError('NO_MOVES', `${label}: nenhum golpe informado. Cada Pokémon precisa de 1 a 4 golpes.`);
    }

    if (parsed.moves.length > 4) {
        throw new ShowdownParseError(
            'TOO_MANY_MOVES',
            `${label}: ${parsed.moves.length} golpes informados. O máximo é 4.`
        );
    }

    return parsed;
}

/** PP usado apenas quando a PokeAPI (ou o cache antigo) não traz o campo `pp`. */
function fallbackPP(move: Move): number {
    if (move.name === 'struggle') return 99;
    if (move.isStatus) return 8;
    if (move.power <= 40) return 12;
    if (move.power <= 60) return 10;
    if (move.power <= 80) return 8;
    if (move.power <= 100) return 6;
    if (move.power <= 120) return 4;
    return 2;
}

function resolveInitialPP(move: Move): number {
    if (typeof move.pp === 'number' && move.pp > 0) return move.pp;
    return fallbackPP(move);
}

async function resolveSet(set: ParsedSet): Promise<Pokemon> {
    let base: Pokemon;
    try {
        // Geração determinística: sem IVs/EVs/nível aleatórios e com o Shiny vindo do texto Showdown.
        base = await fetchPokemonData(set.species, false, false, false, false, false, set.shiny);
    } catch {
        throw new ShowdownParseError(
            'SPECIES_NOT_FOUND',
            `${set.label}: espécie não encontrada na PokeAPI («${set.speciesLabel}»).`
        );
    }

    const expectedApiName = POKEAPI_NAME_MAP[set.species] ?? set.species;
    // A PokeAPI pode devolver a forma canônica mais específica (ex.: "mimikyu" -> "mimikyu-disguised"),
    // mas nunca uma espécie-base no lugar de uma forma inexistente: esse fallback silencioso é rejeitado.
    const speciesMatches = base.speciesId
        ? base.speciesId === expectedApiName || base.speciesId.startsWith(`${expectedApiName}-`)
        : true;
    if (!speciesMatches) {
        throw new ShowdownParseError(
            'SPECIES_NOT_FOUND',
            `${set.label}: a espécie «${set.speciesLabel}» não existe (a PokeAPI devolveu «${base.speciesId}»).`
        );
    }

    const possibleAbilities = (base.possibleAbilities ?? []).map(normalizeSlug);
    const ability = set.ability ?? possibleAbilities[0] ?? normalizeSlug(base.ability);
    if (set.ability && possibleAbilities.length > 0 && !possibleAbilities.includes(ability)) {
        throw new ShowdownParseError(
            'UNKNOWN_ABILITY',
            `${set.label}: habilidade «${set.ability}» não pertence a ${base.name}. Disponíveis: ${possibleAbilities.join(', ')}.`
        );
    }

    const moves: Move[] = [];
    for (const moveSlug of set.moves) {
        let move: Move | null = null;
        try {
            move = await fetchMoveDetails(`https://pokeapi.co/api/v2/move/${moveSlug}/`);
        } catch {
            move = null;
        }
        if (!move) {
            throw new ShowdownParseError(
                'MOVE_NOT_FOUND',
                `${set.label}: golpe não encontrado na PokeAPI («${moveSlug}»).`
            );
        }
        const pp = resolveInitialPP(move);
        moves.push({ ...move, uses: pp, maxUses: pp });
    }

    const gender = set.gender ?? resolveGender(base.speciesId, base.name);
    const baseHp = base.baseHp ?? 50;
    // Caminho canônico do simulador: HP pela statCalculator; os demais atributos derivam dos
    // base stats + IVs + EVs + Natureza em `calculateStat`, então nenhuma fórmula é duplicada aqui.
    const maxHP = calculateMaxHP(baseHp, set.ivs.hp, set.evs.hp, set.level);

    // Se o item veio do texto, o perfil Mega sorteado pela fábrica não corresponde mais ao item.
    const itemChanged = (set.item ?? null) !== (base.heldItem ?? null);

    return {
        ...base,
        name: set.nickname ?? base.name,
        level: set.level,
        evs: set.evs,
        ivs: set.ivs,
        nature: set.nature,
        teraType: set.teraType ?? base.teraType,
        isShiny: set.shiny,
        gender,
        heldItem: set.item,
        hadItem: !!set.item,
        consumedItem: null,
        ability,
        moves,
        movePool: moves,
        maxHP,
        hp: maxHP,
        megaProfile: itemChanged ? undefined : base.megaProfile
    };
}

export async function parseShowdownTeam(text: string, options: ShowdownParseOptions = {}): Promise<Pokemon[]> {
    const normalizedText = (text ?? '').replace(/\r\n?/g, '\n').trim();
    if (!normalizedText) {
        throw new ShowdownParseError('EMPTY_TEAM', 'Nenhum texto Showdown informado.');
    }

    const blocks = normalizedText.split(/\n\s*\n/).map(block => block.trim()).filter(block => block.length > 0);
    if (blocks.length === 0) {
        throw new ShowdownParseError('EMPTY_TEAM', 'Nenhuma equipe encontrada no texto Showdown.');
    }

    if (options.expectedCount !== undefined && blocks.length !== options.expectedCount) {
        throw new ShowdownParseError(
            'TEAM_SIZE_MISMATCH',
            `A equipe Showdown tem ${blocks.length} Pokémon, mas o modo selecionado exige exatamente ${options.expectedCount}.`
        );
    }

    // Validação estrutural de todos os blocos antes de qualquer requisição: nada é importado parcialmente.
    const parsedSets = blocks.map((block, index) => parseBlock(block, index + 1));

    const team: Pokemon[] = [];
    for (const set of parsedSets) {
        team.push(await resolveSet(set));
    }

    return normalizeTeamInstanceIds(team, options.playerNum ?? 1);
}

const titleFromSlug = (slug: string): string =>
    slug
        .split('-')
        .map(word => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
        .join(' ');

const speciesDisplayName = (pokemon: Pokemon): string => {
    const slug = (pokemon.speciesId ?? pokemon.name ?? '').trim();
    return slug
        .split('-')
        .map(word => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
        .join('-');
};

export function exportShowdownTeam(team: Pokemon[]): string {
    return team
        .map(pokemon => {
            const species = speciesDisplayName(pokemon);
            const genderTag = pokemon.gender === 'male' ? ' (M)' : pokemon.gender === 'female' ? ' (F)' : '';

            // Espécie vem de `speciesId`; `name` só vira apelido quando difere do nome canônico.
            const canonicalNames = new Set(
                [species, formatPokemonName(pokemon.speciesId ?? '')].filter(name => !!name)
            );
            const isNicknamed = !!pokemon.name && !canonicalNames.has(pokemon.name);
            const head = isNicknamed ? `${pokemon.name} (${species})` : species;

            const lines = [`${head}${genderTag}${pokemon.heldItem ? ` @ ${titleFromSlug(pokemon.heldItem)}` : ''}`];

            if (pokemon.ability) lines.push(`Ability: ${titleFromSlug(pokemon.ability)}`);

            const level = pokemon.level ?? 100;
            if (level !== 100) lines.push(`Level: ${level}`);

            if (pokemon.isShiny) lines.push('Shiny: Yes');

            if (pokemon.teraType) lines.push(`Tera Type: ${titleFromSlug(pokemon.teraType)}`);

            if (pokemon.evs) {
                const evParts = STAT_KEYS
                    .filter(([key]) => (pokemon.evs?.[key] ?? 0) > 0)
                    .map(([key, label]) => `${pokemon.evs![key]} ${label}`);
                if (evParts.length > 0) lines.push(`EVs: ${evParts.join(' / ')}`);
            }

            if (pokemon.nature) {
                lines.push(`${pokemon.nature.charAt(0).toUpperCase()}${pokemon.nature.slice(1)} Nature`);
            }

            if (pokemon.ivs) {
                const ivParts = STAT_KEYS
                    .filter(([key]) => {
                        const value = pokemon.ivs?.[key];
                        return value !== undefined && value < MAX_IV;
                    })
                    .map(([key, label]) => `${pokemon.ivs![key]} ${label}`);
                if (ivParts.length > 0) lines.push(`IVs: ${ivParts.join(' / ')}`);
            }

            (pokemon.moves ?? []).forEach(move => lines.push(`- ${titleFromSlug(move.name)}`));

            return lines.join('\n');
        })
        .join('\n\n');
}
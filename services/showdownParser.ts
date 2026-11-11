import { Pokemon, Move, PokemonStats } from '../types';
import { fetchPokemonData } from './api/factory';
import { fetchMoveDetails } from './api/client';
import { calculateMaxHP } from './engine/handlers/statCalculator';
import { NATURES } from '../data/natures';
import { POKEMON_NAME_TRANSLATIONS, NAME_SUFFIX_TRANSLATIONS } from '../data/pokemon';

function reverseFormatPokemonName(name: string): string {
    let lowerName = name.toLowerCase().trim();
    
    // Remove gender suffixes that might be appended
    lowerName = lowerName.replace(/\s*\(m\)$/i, '').replace(/\s*\(f\)$/i, '');

    // Check direct translations first
    for (const [key, value] of Object.entries(POKEMON_NAME_TRANSLATIONS)) {
        if (value.toLowerCase() === lowerName) {
            return key;
        }
    }

    let reversed = lowerName;

    // Check suffixes
    for (const [suffix, translation] of Object.entries(NAME_SUFFIX_TRANSLATIONS)) {
        if (!translation.trim()) continue; // Correção Cirúrgica: Ignora traduções vazias para não dar match em tudo
        const lowerTranslation = translation.toLowerCase();
        if (reversed.endsWith(lowerTranslation)) {
            reversed = reversed.slice(0, -lowerTranslation.length) + suffix;
            break;
        }
    }

    // Replace remaining spaces with dashes and remove invalid characters
    return reversed.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-\s]/g, '').replace(/\s+/g, '-');
}

export async function parseShowdownTeam(text: string): Promise<Pokemon[]> {
    const team: Pokemon[] = [];
    const blocks = text.trim().split(/\n\s*\n/);

    for (const block of blocks) {
        if (!block.trim()) continue;

        const lines = block.split('\n').map(l => l.trim());
        const firstLine = lines[0];
        
        // Parse first line: Nickname (Species) (Gender) @ Item
        let namePart = firstLine.split('@')[0].trim();
        const item = firstLine.includes('@') ? firstLine.split('@')[1].trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-\s]/g, '').replace(/\s+/g, '-') : null;

        let species = namePart;
        let nickname = namePart;

        const speciesMatch = namePart.match(/(.*)\s+\((.*)\)/);
        if (speciesMatch) {
            // Check if the part in parentheses is just a gender (M) or (F)
            if (speciesMatch[2] === 'M' || speciesMatch[2] === 'F') {
                species = speciesMatch[1].trim();
                nickname = speciesMatch[1].trim();
            } else {
                nickname = speciesMatch[1].trim();
                species = speciesMatch[2].trim();
                
                // It might be Nickname (Species) (M)
                const genderMatch = species.match(/(.*)\s+\((M|F)\)/);
                if (genderMatch) {
                    species = genderMatch[1].trim();
                }
            }
        }

        const formattedSpecies = reverseFormatPokemonName(species);

        let ability = '';
        let level = 100;
        let shiny = false;
        let evs: Partial<PokemonStats> = {};
        let ivs: Partial<PokemonStats> = { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 };
        let nature = 'Hardy';
        const moves: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('Ability:')) ability = line.replace('Ability:', '').trim();
            else if (line.startsWith('Level:')) level = parseInt(line.replace('Level:', '').trim()) || 100;
            else if (line.startsWith('Shiny:')) shiny = line.includes('Yes');
            else if (line.startsWith('EVs:')) evs = parseStats(line.replace('EVs:', ''));
            else if (line.startsWith('IVs:')) ivs = { ...ivs, ...parseStats(line.replace('IVs:', '')) };
            else if (line.includes('Nature')) nature = line.replace('Nature', '').trim();
            else if (line.startsWith('-')) {
                let moveName = line.replace('-', '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (moveName.startsWith('hidden power')) {
                    moveName = 'hidden-power';
                } else {
                    moveName = moveName.replace(/[^a-z0-9-\s]/g, '').replace(/\s+/g, '-');
                }
                if (moveName) moves.push(moveName);
            }
        }

        try {
            // Fetch base data
            const basePokemon = await fetchPokemonData(formattedSpecies, false, false, false, true, true);
            
            // Override with Showdown data
            basePokemon.name = nickname;
            basePokemon.level = level;
            if (item) basePokemon.heldItem = item;
            if (ability) basePokemon.ability = ability.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-\s]/g, '').replace(/\s+/g, '-');
            
            basePokemon.evs = {
                hp: evs.hp || 0,
                attack: evs.attack || 0,
                defense: evs.defense || 0,
                spAttack: evs.spAttack || 0,
                spDefense: evs.spDefense || 0,
                speed: evs.speed || 0
            };
            
            basePokemon.ivs = {
                hp: ivs.hp ?? 31,
                attack: ivs.attack ?? 31,
                defense: ivs.defense ?? 31,
                spAttack: ivs.spAttack ?? 31,
                spDefense: ivs.spDefense ?? 31,
                speed: ivs.speed ?? 31
            };
            
            basePokemon.nature = nature;

            // Fetch specific moves
            const resolvedMoves: Move[] = [];
            for (const moveName of moves.slice(0, 4)) {
                try {
                    const moveUrl = `https://pokeapi.co/api/v2/move/${moveName}/`;
                    const moveData = await fetchMoveDetails(moveUrl);
                    if (moveData) resolvedMoves.push(moveData);
                } catch (e) {
                    console.warn(`Failed to fetch move: ${moveName}`);
                }
            }
            
            if (resolvedMoves.length > 0) {
                basePokemon.moves = resolvedMoves;
            }

            // Recalculate HP
            basePokemon.maxHP = calculateMaxHP(basePokemon.baseHp || 50, basePokemon.ivs.hp, basePokemon.evs.hp, basePokemon.level);
            basePokemon.hp = basePokemon.maxHP;

            team.push(basePokemon);
        } catch (e) {
            console.error(`Failed to parse/fetch pokemon: ${species}`, e);
        }
    }

    return team;
}

function parseStats(statString: string): Partial<PokemonStats> {
    const stats: Partial<PokemonStats> = {};
    const parts = statString.split('/').map(s => s.trim());
    
    const statMap: Record<string, keyof PokemonStats> = {
        'HP': 'hp',
        'Atk': 'attack',
        'Def': 'defense',
        'SpA': 'spAttack',
        'SpD': 'spDefense',
        'Spe': 'speed'
    };

    for (const part of parts) {
        const [val, name] = part.split(' ');
        if (val && name && statMap[name]) {
            stats[statMap[name]] = parseInt(val) || 0;
        }
    }
    return stats;
}

export function exportShowdownTeam(team: Pokemon[]): string {
    let output = '';

    for (const p of team) {
        // Nickname (Species) @ Item
        // If nickname is the same as species, just use Species
        // But we don't have the original species name easily available, so we'll just use the name
        let firstLine = p.name;
        if (p.heldItem) {
            const formattedItem = p.heldItem.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            firstLine += ` @ ${formattedItem}`;
        }
        output += firstLine + '\n';

        if (p.ability) {
            const formattedAbility = p.ability.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            output += `Ability: ${formattedAbility}\n`;
        }

        if (p.level && p.level !== 100) {
            output += `Level: ${p.level}\n`;
        }

        if (p.evs) {
            const evParts = [];
            if (p.evs.hp) evParts.push(`${p.evs.hp} HP`);
            if (p.evs.attack) evParts.push(`${p.evs.attack} Atk`);
            if (p.evs.defense) evParts.push(`${p.evs.defense} Def`);
            if (p.evs.spAttack) evParts.push(`${p.evs.spAttack} SpA`);
            if (p.evs.spDefense) evParts.push(`${p.evs.spDefense} SpD`);
            if (p.evs.speed) evParts.push(`${p.evs.speed} Spe`);
            if (evParts.length > 0) {
                output += `EVs: ${evParts.join(' / ')}\n`;
            }
        }

        if (p.nature) {
            output += `${p.nature} Nature\n`;
        }

        if (p.ivs) {
            const ivParts = [];
            if (p.ivs.hp !== undefined && p.ivs.hp < 31) ivParts.push(`${p.ivs.hp} HP`);
            if (p.ivs.attack !== undefined && p.ivs.attack < 31) ivParts.push(`${p.ivs.attack} Atk`);
            if (p.ivs.defense !== undefined && p.ivs.defense < 31) ivParts.push(`${p.ivs.defense} Def`);
            if (p.ivs.spAttack !== undefined && p.ivs.spAttack < 31) ivParts.push(`${p.ivs.spAttack} SpA`);
            if (p.ivs.spDefense !== undefined && p.ivs.spDefense < 31) ivParts.push(`${p.ivs.spDefense} SpD`);
            if (p.ivs.speed !== undefined && p.ivs.speed < 31) ivParts.push(`${p.ivs.speed} Spe`);
            if (ivParts.length > 0) {
                output += `IVs: ${ivParts.join(' / ')}\n`;
            }
        }

        for (const move of p.moves) {
            const formattedMove = move.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            output += `- ${formattedMove}\n`;
        }

        output += '\n';
    }

    return output.trim();
}

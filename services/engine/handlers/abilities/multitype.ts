
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { TYPE_NAMES_PT } from '../../../../data/types';

/**
 * Lógica para a habilidade Multitipo (Multitype).
 * Exclusiva de Arceus.
 * Regra Oficial: Muda o tipo do Pokémon dependendo da Placa (Plate) ou Cristal Z (não implementado) segurado.
 */

const PLATE_MAP: Record<string, { type: string, id: number }> = {
    'flame-plate': { type: 'fire', id: 493 },
    'splash-plate': { type: 'water', id: 493 },
    'zap-plate': { type: 'electric', id: 493 },
    'meadow-plate': { type: 'grass', id: 493 },
    'icicle-plate': { type: 'ice', id: 493 },
    'fist-plate': { type: 'fighting', id: 493 },
    'toxic-plate': { type: 'poison', id: 493 },
    'earth-plate': { type: 'ground', id: 493 },
    'sky-plate': { type: 'flying', id: 493 },
    'mind-plate': { type: 'psychic', id: 493 },
    'insect-plate': { type: 'bug', id: 493 },
    'stone-plate': { type: 'rock', id: 493 },
    'spooky-plate': { type: 'ghost', id: 493 },
    'draco-plate': { type: 'dragon', id: 493 },
    'dread-plate': { type: 'dark', id: 493 },
    'iron-plate': { type: 'steel', id: 493 },
    'pixie-plate': { type: 'fairy', id: 493 },
};

export function handleMultitype(pokemon: Pokemon, logs: { message: string, color: string }[]): boolean {
    if (pokemon.ability !== 'multitype' || pokemon.isFainted) {
        return false;
    }

    const item = pokemon.heldItem || '';
    const plateData = PLATE_MAP[item];

    if (plateData) {
        const newType = plateData.type;
        
        // Verifica se já está com o tipo correto para evitar logs redundantes
        if (pokemon.types.length === 1 && pokemon.types[0] === newType) {
            return false;
        }

        pokemon.types = [newType];
        // Atualiza Sprite (Forms IDs 10041-10057 no PokeAPI conflitam com Mega Evoluções, usamos o base 493)
        // Força a string para garantir integridade
        const spriteId = plateData.id;
        pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${spriteId}.png`;

        const typeName = TYPE_NAMES_PT[newType] || newType;
        log(logs, `${pokemon.name} mudou seu tipo para ${typeName} devido à sua Placa!`, 'text-indigo-600 font-bold italic');
        return true;
    } else {
        // Sem placa: Volta ao tipo Normal
        if (pokemon.types.length === 1 && pokemon.types[0] === 'normal') {
            return false;
        }
        pokemon.types = ['normal'];
        pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/493.png`;
        return true;
    }
}

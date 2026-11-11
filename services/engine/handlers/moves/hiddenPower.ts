
import { Pokemon, Move } from '../../../../types';

// Tipos possíveis para Hidden Power (Gen 6+: Normal e Fairy não são possíveis)
// A ordem é fixa e baseada nos índices de bit originais:
// 0: Fighting, 1: Flying, 2: Poison, 3: Ground, 4: Rock, 5: Bug, 6: Ghost, 7: Steel,
// 8: Fire, 9: Water, 10: Grass, 11: Electric, 12: Psychic, 13: Ice, 14: Dragon, 15: Dark
const HP_TYPES = [
    'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 
    'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark'
];

/**
 * Calcula o tipo do Poder Oculto baseado no ID do Pokémon.
 * Nos jogos originais, isso é baseado em IVs. Aqui simulamos usando o ID de forma determinística.
 */
export function getHiddenPowerType(pokemon: Pokemon): string {
    if (!pokemon) return 'normal';
    
    // CORREÇÃO: O multiplicador anterior (100000) era divisível por 16, resultando sempre em resto 0 (Fighting).
    // Usamos um número primo (7) para espalhar os tipos através dos IDs.
    const seed = Math.floor(pokemon.id * 7); 
    const typeIndex = seed % HP_TYPES.length;
    
    return HP_TYPES[typeIndex] || 'normal';
}

/**
 * Retorna o tipo efetivo do movimento. Se for Poder Oculto, calcula o tipo especial.
 */
export function getEffectiveType(pokemon: Pokemon, move: Move): string {
    if (move.name === 'hidden-power') {
        return getHiddenPowerType(pokemon);
    }
    return move.type;
}

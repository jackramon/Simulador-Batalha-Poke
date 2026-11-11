
import { Pokemon } from '../../../../types';

/**
 * Verifica se a habilidade Sombra Presa (Shadow Tag) do oponente deve aprisionar o Pokémon atual.
 * Regra: Impede a troca de qualquer Pokémon, a menos que ele também tenha Shadow Tag 
 * ou seja do tipo Fantasma.
 */
export function canTrap(pokemon: Pokemon, opponent: Pokemon): boolean {
    if (opponent.ability !== 'shadow-tag') return false;
    
    // Pokémon do tipo Fantasma são imunes a aprisionamento desde a Gen 6.
    if (pokemon.types.includes('ghost')) return false;

    // Usuários de Shadow Tag são imunes ao Shadow Tag alheio.
    if (pokemon.ability === 'shadow-tag') return false;

    return true;
}

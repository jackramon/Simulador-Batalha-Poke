
import { Pokemon } from '../../../../types';

/**
 * Verifica se a habilidade Imã (Magnet Pull) do oponente deve aprisionar o Pokémon atual.
 * Regra: Pokémon do tipo Aço não podem trocar se o oponente tiver Imã.
 */
export function canTrap(pokemon: Pokemon, opponent: Pokemon): boolean {
    if (opponent.ability !== 'magnet-pull') return false;
    
    // Tipos Fantasma são imunes a aprisionamento desde a Gen 6, 
    // mesmo que o hub principal já verifique isso, é boa prática manter a lógica da habilidade íntegra.
    if (pokemon.types.includes('ghost')) return false;

    return pokemon.types.includes('steel');
}

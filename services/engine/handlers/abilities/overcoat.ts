
import { Pokemon, Move } from '../../../../types';

/**
 * Lista de movimentos baseados em pó/esporos que o Sobretudo ignora.
 */
const POWDER_MOVES = [
    'spore', 'sleep-powder', 'poison-powder', 'stun-spore', 
    'cotton-spore', 'powder', 'rage-powder'
];

/**
 * Verifica se o Pokémon é imune a danos climáticos devido ao Sobretudo.
 */
export function isImmuneToWeather(pokemon: Pokemon): boolean {
    return pokemon.ability === 'overcoat';
}

/**
 * Verifica se o Pokémon é imune a efeitos de pó (como Esporos de Efeito).
 */
export function isImmuneToPowderEffects(pokemon: Pokemon): boolean {
    return pokemon.ability === 'overcoat';
}

/**
 * Verifica se a habilidade bloqueia um movimento específico.
 * @param target O Pokémon defensor.
 * @param move O movimento sendo usado.
 * @param ignoresAbilities Se o atacante ignora habilidades (Mold Breaker).
 */
export function blocksMove(target: Pokemon, move: Move, ignoresAbilities: boolean): boolean {
    if (ignoresAbilities) return false;
    if (target.ability !== 'overcoat') return false;
    
    return POWDER_MOVES.includes(move.name);
}

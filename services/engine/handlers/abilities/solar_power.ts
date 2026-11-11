import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Poder Solar (Solar Power).
 * Regras Oficiais:
 * 1. Aumenta o Atq. Especial em 1.5x sob Sol Forte.
 * 2. Perde 1/8 do HP máximo ao final de cada turno sob Sol Forte.
 */

export function getSpAttackMultiplier(pokemon: Pokemon, weather: string): number {
    if (pokemon.ability === 'solar-power' && weather === 'sun' && !pokemon.isFainted) {
        return 1.5;
    }
    return 1.0;
}

export function handleSolarPowerDamage(
    pokemon: Pokemon, 
    weather: string, 
    logs: {message: string, color: string}[]
): boolean {
    if (pokemon.ability !== 'solar-power' || weather !== 'sun' || pokemon.isFainted) {
        return false;
    }

    // Fix: A comparison between 'solar-power' and 'magic-guard' is logically impossible here 
    // because a Pokémon can only have one active ability at a time. TypeScript identifies 
    // this comparison as dead code/error because the variable has been narrowed to 'solar-power'.
    const damage = Math.floor(pokemon.maxHP / 8) || 1;
    pokemon.hp = Math.max(0, pokemon.hp - damage);
    
    logs.push({
        message: `${pokemon.name} perdeu vida pelo seu Poder Solar sob o sol!`,
        color: 'text-red-500 italic text-xs'
    });

    if (pokemon.hp === 0) {
        pokemon.isFainted = true;
    }

    return true;
}

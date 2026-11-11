import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Hospitalidade (Hospitality).
 * Regra Oficial: Ao entrar em batalha, o Pokémon restaura 25% do HP máximo do seu aliado.
 * Adaptação 1v1: Cura o Pokémon que acabou de sair de campo (lastPokemonSnapshot).
 */
export function handleHospitality(
    pokemon: Pokemon, 
    lastPokemon: Pokemon | null, 
    logs: {message: string, color: string}[]
): boolean {
    if (pokemon.ability !== 'hospitality' || !lastPokemon || lastPokemon.isFainted) {
        return false;
    }

    // Regra: Restaura 1/4 (25%) do HP máximo do aliado
    const healAmount = Math.floor(lastPokemon.maxHP / 4);
    const initialHp = lastPokemon.hp;
    
    if (initialHp < lastPokemon.maxHP) {
        lastPokemon.hp = Math.min(lastPokemon.maxHP, lastPokemon.hp + healAmount);
        const actualHealed = lastPokemon.hp - initialHp;

        log(logs, `${pokemon.name} usou sua Hospitalidade para curar ${lastPokemon.name}!`, 'text-green-600 font-bold italic');
        return true;
    }

    return false;
}

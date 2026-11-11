
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Cura Venenosa (Poison Heal).
 * Regra Oficial: Restaura 1/8 do HP máximo a cada turno se o Pokémon estiver envenenado.
 */
export function handlePoisonHeal(pokemon: Pokemon, logs: {message: string, color: string}[]): boolean {
    if (pokemon.isFainted) return false;

    const healAmount = Math.floor(pokemon.maxHP / 8) || 1;
    const previousHp = pokemon.hp;
    pokemon.hp = Math.min(pokemon.maxHP, pokemon.hp + healAmount);
    
    if (pokemon.hp > previousHp) {
        log(logs, `A Cura Venenosa de ${pokemon.name} recuperou sua vida!`, 'text-green-600 font-bold');
        return true;
    }
    return false;
}

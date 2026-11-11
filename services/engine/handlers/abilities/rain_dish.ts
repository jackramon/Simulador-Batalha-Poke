
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Prato de Chuva (Rain Dish).
 * Recupera 1/16 do HP máximo ao final de cada turno se o clima for Chuva (Rain).
 */
export function handleRainDish(pokemon: Pokemon, weather: BattleState['weather'], logs: {message: string, color: string}[]) {
    if (weather === 'rain' && pokemon.hp < pokemon.maxHP && !pokemon.isFainted) {
        const healAmount = Math.floor(pokemon.maxHP / 16) || 1;
        pokemon.hp = Math.min(pokemon.maxHP, pokemon.hp + healAmount);
        log(logs, `O Prato de Chuva de ${pokemon.name} recuperou um pouco de vida sob a chuva!`, 'text-blue-600 font-bold');
        return true;
    }
    return false;
}

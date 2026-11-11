
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Corpo de Gelo (Ice Body).
 * Recupera 1/16 do HP máximo ao final de cada turno se o clima for Granizo (Hail).
 */
export function handleIceBody(pokemon: Pokemon, weather: BattleState['weather'], logs: {message: string, color: string}[]) {
    if (weather === 'hail' && pokemon.hp < pokemon.maxHP && !pokemon.isFainted) {
        const healAmount = Math.floor(pokemon.maxHP / 16) || 1;
        pokemon.hp = Math.min(pokemon.maxHP, pokemon.hp + healAmount);
        log(logs, `O Corpo de Gelo de ${pokemon.name} recuperou um pouco de vida sob o granizo!`, 'text-cyan-600 font-bold');
        return true;
    }
    return false;
}

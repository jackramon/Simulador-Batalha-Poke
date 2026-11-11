
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as Overcoat from '../abilities/overcoat';

/**
 * Processa o dano causado por climas (Areia e Granizo) ao fim do turno.
 * Regra: 1/16 do HP máximo.
 */
export function handleWeatherDamage(
    pokemon: Pokemon, 
    weather: BattleState['weather'], 
    logs: { message: string, color: string }[]
): void {
    if (pokemon.isFainted || weather === 'none') return;

    // Magic Guard e Sobretudo protegem contra danos climáticos
    if (pokemon.ability === 'magic-guard' || Overcoat.isImmuneToWeather(pokemon)) {
        return;
    }

    let isDamaged = false;
    let weatherName = '';

    if (weather === 'sand') {
        // Imunidades Areia: Tipos Pedra, Terra, Aço. Habilidades: Sand Veil, Sand Rush, Sand Force.
        const isImmuneType = ['rock', 'ground', 'steel'].some(t => pokemon.types.includes(t));
        const isImmuneAbility = ['sand-veil', 'sand-rush', 'sand-force'].includes(pokemon.ability);
        
        if (!isImmuneType && !isImmuneAbility) {
            isDamaged = true;
            weatherName = 'tempestade de areia';
        }
    } else if (weather === 'hail') {
        // Imunidades Granizo: Tipo Gelo. Habilidades: Ice Body, Snow Cloak, Slush Rush.
        const isImmuneType = pokemon.types.includes('ice');
        const isImmuneAbility = ['ice-body', 'snow-cloak', 'slush-rush'].includes(pokemon.ability);
        
        if (!isImmuneType && !isImmuneAbility) {
            isDamaged = true;
            weatherName = 'granizo';
        }
    }

    if (isDamaged) {
        const damage = Math.floor(pokemon.maxHP / 16) || 1;
        pokemon.hp = Math.max(0, pokemon.hp - damage);
        
        log(logs, `${pokemon.name} é castigado pela ${weatherName} e sofreu ${damage} de dano!`, 'text-gray-600 italic');

        if (pokemon.hp === 0) {
            pokemon.isFainted = true;
        }
    }
}

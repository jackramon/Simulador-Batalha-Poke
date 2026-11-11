import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { TYPE_NAMES_PT } from '../../../../data/types';
import * as NeutralizingGas from './neutralizing_gas';
import * as AirLock from './air_lock';

/**
 * Lógica para a habilidade Previsão (Forecast).
 * Exclusiva de Castform.
 * Regra Oficial: Muda o tipo e a aparência do Pokémon baseando-se no clima ativo.
 * - Sol: Fogo (ID 10013)
 * - Chuva: Água (ID 10014)
 * - Granizo: Gelo (ID 10015)
 * - Outros/Nenhum: Normal (ID 351)
 */

export function handleForecast(pokemon: Pokemon, state: BattleState, logs: { message: string, color: string }[]): boolean {
    if (pokemon.ability !== 'forecast' || pokemon.isFainted) {
        return false;
    }

    // Se o Gás Neutralizante estiver ativo, Castform volta/fica na forma Normal
    const isSuppressed = !NeutralizingGas.canAbilityTrigger(pokemon, state);
    
    // Se Air Lock/Cloud Nine estiver ativo, o clima é tratado como "none" para o Forecast
    const isWeatherSuppressed = AirLock.isWeatherSuppressed(state);
    const effectiveWeather = (isSuppressed || isWeatherSuppressed) ? 'none' : state.weather;

    let targetType = 'normal';
    let spriteId = 351; // Castform Normal

    if (effectiveWeather === 'sun') {
        targetType = 'fire';
        spriteId = 10013;
    } else if (effectiveWeather === 'rain') {
        targetType = 'water';
        spriteId = 10014;
    } else if (effectiveWeather === 'hail') {
        targetType = 'ice';
        spriteId = 10015;
    }

    // Verifica se já está na forma correta
    if (pokemon.types.length === 1 && pokemon.types[0] === targetType) {
        return false;
    }

    // Aplica a transformação
    pokemon.types = [targetType];
    pokemon.spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${spriteId}.png`;

    const typeName = TYPE_NAMES_PT[targetType] || targetType;
    if (targetType === 'normal') {
        log(logs, `${pokemon.name} voltou à sua forma normal!`, 'text-gray-500 italic');
    } else {
        log(logs, `A Previsão de ${pokemon.name} alterou sua forma para o tipo ${typeName}!`, 'text-indigo-600 font-bold italic');
    }

    return true;
}

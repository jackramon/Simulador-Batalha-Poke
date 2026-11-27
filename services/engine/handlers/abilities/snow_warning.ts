
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { isSnowyWeather } from '../../mechanics/weather';

/**
 * Lógica para a habilidade Alerta de Neve (Snow Warning).
 * Regra Oficial (Gen 9): invoca Neve ao entrar em batalha.
 * A Neve não causa dano residual; o Granizo legado é um clima separado.
 */
export function triggerSnowWarning(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]): string | undefined {
    if (pokemon.ability !== 'snow-warning' || pokemon.isFainted) return undefined;

    if (!isSnowyWeather(state.weather)) {
        log(logs, `O Alerta de Neve de ${pokemon.name} invocou a neve!`, 'text-cyan-600 font-bold italic');
        return 'snow';
    }
    
    return undefined;
}

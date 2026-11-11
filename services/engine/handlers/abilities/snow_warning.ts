
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Alerta de Neve (Snow Warning).
 * Regra Oficial: Invoca Granizo (Hail/Snow) ao entrar em batalha.
 */
export function triggerSnowWarning(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]): string | undefined {
    if (pokemon.ability !== 'snow-warning' || pokemon.isFainted) return undefined;

    if (state.weather !== 'hail') {
        log(logs, `O Alerta de Neve de ${pokemon.name} invocou o granizo!`, 'text-cyan-600 font-bold italic');
        return 'hail';
    }
    
    return undefined;
}

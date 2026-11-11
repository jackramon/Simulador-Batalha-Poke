
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Seca (Drought).
 * Regra Oficial: Invoca Sol Forte (Harsh Sunlight) ao entrar em batalha.
 */
export function triggerDrought(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]): string | undefined {
    if (pokemon.ability !== 'drought' || pokemon.isFainted) return undefined;

    if (state.weather !== 'sun') {
        log(logs, `A Seca de ${pokemon.name} intensificou os raios solares!`, 'text-orange-500 font-bold italic');
        return 'sun';
    }
    
    return undefined;
}

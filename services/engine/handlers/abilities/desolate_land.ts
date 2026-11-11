import { Pokemon, BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Terra Desolada (Desolate Land).
 * Invoca luz solar extremamente forte, que evapora ataques de Água.
 */
export function triggerDesolateLand(pokemon: Pokemon, state: BattleState, logs: LogEntry[]): string | undefined {
    if (pokemon.ability !== 'desolate-land' || pokemon.isFainted) return undefined;

    if (state.weather !== 'sun') {
        log(logs, `A Terra Desolada de ${pokemon.name} intensificou os raios solares ao extremo!`, 'text-orange-600 font-bold italic');
        return 'sun';
    }
    
    return undefined;
}

export function isDesolateLandActive(state: BattleState): boolean {
    if (state.weather !== 'sun') return false;
    
    const p1 = state.currentPokemon1;
    const p2 = state.currentPokemon2;
    
    return (p1?.ability === 'desolate-land' && !p1.isFainted) || 
           (p2?.ability === 'desolate-land' && !p2.isFainted);
}

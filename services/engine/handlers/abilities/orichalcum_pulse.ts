
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Pulso de Oricalco (Orichalcum Pulse).
 * Regras Oficiais:
 * 1. Invoca Sol Forte (Sun) ao entrar em batalha.
 * 2. Aumenta o Ataque do usuário em ~33% (1.3333x) enquanto o Sol estiver ativo.
 */

export function triggerWeather(pokemon: Pokemon, state: BattleState, logs: {message: string, color: string}[]): string | undefined {
    if (pokemon.ability !== 'orichalcum-pulse' || pokemon.isFainted) {
        return undefined;
    }

    if (state.weather !== 'sun') {
        log(logs, `O Pulso de Oricalco de ${pokemon.name} invocou um sol escaldante!`, 'text-orange-600 font-bold italic');
        return 'sun';
    }
    
    return undefined;
}

export function getAttackMultiplier(attacker: Pokemon, weather: string): number {
    if (attacker.ability === 'orichalcum-pulse' && weather === 'sun' && !attacker.isFainted) {
        return 1.3333;
    }
    return 1.0;
}

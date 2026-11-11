
import { Pokemon, Move } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Lógica para a habilidade Troca Térmica (Thermal Exchange).
 * Regras:
 * 1. Aumenta o Ataque em 1 estágio ao ser atingido por um movimento do tipo Fogo.
 * 2. O Pokémon não pode sofrer queimaduras (Burn).
 */
export function triggerThermalExchange(pokemon: Pokemon, move: Move, logs: LogEntry[]): boolean {
    if (pokemon.ability !== 'thermal-exchange' || pokemon.isFainted) return false;

    if (move.type === 'fire') {
        if (pokemon.statStages.attack < 6) {
            pokemon.statStages.attack++;
            log(logs, `A Troca Térmica de ${pokemon.name} aumentou seu Ataque ao ser atingido por um golpe de Fogo!`, 'text-orange-600 font-bold');
            return true;
        }
    }
    return false;
}

export function isImmuneToBurn(pokemon: Pokemon): boolean {
    return pokemon.ability === 'thermal-exchange';
}


import { Pokemon, Move } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Ativa o efeito da habilidade Motor a Vapor (Steam Engine).
 * Aumenta a Velocidade do Pokémon em 6 estágios ao ser atingido por um golpe de Fogo ou Água.
 */
export function triggerSteamEngine(pokemon: Pokemon, move: Move, logs: LogEntry[]): boolean {
    if (pokemon.ability !== 'steam-engine' || pokemon.isFainted) return false;

    if (move.type === 'fire' || move.type === 'water') {
        if (pokemon.statStages.speed < 6) {
            pokemon.statStages.speed = 6;
            log(logs, `O Motor a Vapor de ${pokemon.name} maximizou sua Velocidade!`, 'text-indigo-600 font-black animate-pulse');
            return true;
        }
    }
    return false;
}

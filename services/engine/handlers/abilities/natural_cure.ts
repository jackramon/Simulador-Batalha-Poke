
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Lógica para a habilidade Cura Natural (Natural Cure).
 * Cura todas as condições de status do Pokémon ao ser trocado.
 */
export function handleNaturalCure(pokemon: Pokemon, logs: LogEntry[]): boolean {
    if (pokemon.ability === 'natural-cure' && Object.keys(pokemon.statusEffects).length > 0) {
        pokemon.statusEffects = {};
        log(logs, `${pokemon.name} curou seus status com Cura Natural ao sair!`, 'text-blue-500 font-bold');
        return true;
    }
    return false;
}

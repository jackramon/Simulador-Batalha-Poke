
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Lógica para a habilidade Tempo Próprio (Own Tempo).
 * Regras Oficiais:
 * 1. Imunidade a Confusão (Confusion).
 * 2. Imunidade a Intimidação (Intimidate) - Regra Gen 8+.
 */

export function isImmuneToConfusion(pokemon: Pokemon, ignoresAbilities: boolean = false): boolean {
    if (ignoresAbilities || pokemon.isFainted) return false;
    return pokemon.ability === 'own-tempo';
}

export function isImmuneToIntimidate(pokemon: Pokemon): boolean {
    if (pokemon.isFainted) return false;
    return pokemon.ability === 'own-tempo';
}

/**
 * Verifica e cura a confusão do Pokémon se ele possuir a habilidade Tempo Próprio.
 * Útil para gatilhos de entrada ou troca de habilidade.
 */
export function checkOwnTempo(pokemon: Pokemon, logs: LogEntry[]): boolean {
    if (pokemon.ability === 'own-tempo' && pokemon.statusEffects.confusion) {
        delete pokemon.statusEffects.confusion;
        log(logs, `${pokemon.name} recuperou o juízo devido à sua habilidade Tempo Próprio!`, 'text-blue-600 font-bold');
        return true;
    }
    return false;
}

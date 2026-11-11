
import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';

/**
 * Lógica para a habilidade Insensível (Oblivious).
 * Regras Oficiais:
 * 1. Imunidade a Apaixonamento (Infatuation).
 * 2. Imunidade a Provocação (Taunt).
 * 3. Imunidade a Intimidação (Intimidate) - Regra Gen 8+.
 * 4. Imunidade a Tormento (Torment) - Regra Gen 6+.
 */

export function isImmuneToInfatuation(pokemon: Pokemon, ignoresAbilities: boolean = false): boolean {
    if (ignoresAbilities || pokemon.isFainted) return false;
    return pokemon.ability === 'oblivious';
}

export function isImmuneToTaunt(pokemon: Pokemon, ignoresAbilities: boolean = false): boolean {
    if (ignoresAbilities || pokemon.isFainted) return false;
    return pokemon.ability === 'oblivious';
}

export function isImmuneToIntimidate(pokemon: Pokemon): boolean {
    if (pokemon.isFainted) return false;
    return pokemon.ability === 'oblivious';
}

export function isImmuneToTorment(pokemon: Pokemon, ignoresAbilities: boolean = false): boolean {
    if (ignoresAbilities || pokemon.isFainted) return false;
    return pokemon.ability === 'oblivious';
}

/**
 * Verifica e cura a confusão do Pokémon se ele possuir a habilidade Tempo Próprio.
 * Útil para gatilhos de entrada ou troca de habilidade.
 */
export function checkOblivious(pokemon: Pokemon, logs: LogEntry[]): boolean {
    let cured = false;
    if (pokemon.ability === 'oblivious') {
        if (pokemon.statusEffects.infatuation) {
            delete pokemon.statusEffects.infatuation;
            log(logs, `${pokemon.name} não está mais apaixonado devido à sua habilidade Insensível!`, 'text-blue-600 font-bold');
            cured = true;
        }
        if (pokemon.statusEffects.taunt) {
            delete pokemon.statusEffects.taunt;
            log(logs, `${pokemon.name} não está mais provocado devido à sua habilidade Insensível!`, 'text-blue-600 font-bold');
            cured = true;
        }
        if (pokemon.statusEffects.torment) {
            delete pokemon.statusEffects.torment;
            log(logs, `${pokemon.name} não está mais atormentado devido à sua habilidade Insensível!`, 'text-blue-600 font-bold');
            cured = true;
        }
    }
    return cured;
}

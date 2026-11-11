import { Pokemon } from '../../../../types';
import { log, LogEntry } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Verifica se o Pokémon está no turno de "vadiagem" da habilidade Preguiça.
 * Se estiver, consome o estado e retorna verdadeiro para bloquear a ação.
 */
export function shouldLoafAround(pokemon: Pokemon, logs: LogEntry[]): boolean {
    if (pokemon.ability !== 'truant') return false;

    if (pokemon.statusEffects['truant-loafing']) {
        log(logs, BATTLE_MESSAGES.LOAFING_AROUND(pokemon.name), 'text-gray-500 italic');
        // Remove o status após "vadiar" para permitir o ataque no próximo turno
        delete pokemon.statusEffects['truant-loafing'];
        return true;
    }
    return false;
}

/**
 * Marca o Pokémon para vadiar no próximo turno.
 */
export function setLoafingNextTurn(pokemon: Pokemon) {
    if (pokemon.ability === 'truant') {
        pokemon.statusEffects['truant-loafing'] = { turns: 1 };
    }
}

/**
 * Sincroniza a vadiagem com o turno de recarga (ex: Giga Impact).
 * Se o Pokémon recarregou, ele já cumpriu sua vadiagem.
 */
export function consumeLoafingOnRecharge(pokemon: Pokemon) {
    if (pokemon.ability === 'truant' && pokemon.statusEffects['truant-loafing']) {
        delete pokemon.statusEffects['truant-loafing'];
    }
}

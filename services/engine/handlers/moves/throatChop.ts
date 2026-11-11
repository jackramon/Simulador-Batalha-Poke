
import { Pokemon, Move } from '../../../../types';
import { log, LogEntry } from '../../utils';
import { SOUND_MOVES } from '../../../../data/moves/categories';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Aplica o efeito do Golpe na Garganta (Throat Chop).
 * Impede o uso de golpes sonoros por 2 turnos.
 */
export function handleThroatChopEffect(defender: Pokemon, logs: {message: string, color: string}[]) {
    if (defender.isFainted) return;

    // Define o status. 2 Turnos (o atual e o próximo)
    defender.statusEffects['throat-chop-prevention'] = { turns: 2 };
    
    log(logs, BATTLE_MESSAGES.THROAT_CHOP_START(defender.name), 'text-red-600 font-bold italic');
}

/**
 * Verifica se o movimento selecionado está bloqueado pelo Golpe na Garganta.
 */
export function isBlockedByThroatChop(attacker: Pokemon, move: Move, logs: LogEntry[]): boolean {
    if (attacker.statusEffects['throat-chop-prevention']) {
        if (SOUND_MOVES.includes(move.name)) {
            log(logs, BATTLE_MESSAGES.THROAT_CHOP_BLOCK(attacker.name, move.displayName), 'text-gray-500 italic');
            return true;
        }
    }
    return false;
}

/**
 * Processa o contador de turnos no final do round.
 */
export function handleThroatChopTurnEnd(pokemon: Pokemon) {
    if (pokemon.statusEffects['throat-chop-prevention']) {
        pokemon.statusEffects['throat-chop-prevention'].turns--;
        if (pokemon.statusEffects['throat-chop-prevention'].turns <= 0) {
            delete pokemon.statusEffects['throat-chop-prevention'];
        }
    }
}

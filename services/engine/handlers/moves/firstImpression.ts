
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Verifica se o movimento Primeira Impressão (First Impression) vai falhar.
 * Regra Oficial: Só funciona no primeiro turno em que o Pokémon está em campo.
 */
export function checkFailure(attacker: Pokemon, logs: {message: string, color: string}[]): boolean {
    // turnsActive é 0 no turno de entrada e incrementa no final do turno.
    if (attacker.turnsActive > 0) {
        log(logs, BATTLE_MESSAGES.FIRST_IMPRESSION_FAIL(), 'text-gray-500 italic');
        return true;
    }
    return false;
}


import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

const HEAL_BLOCK_KEY = 'heal-block';

/**
 * Aplica o efeito de Ruído Psíquico (Psychic Noise).
 * Impede a cura do alvo por 2 turnos.
 */
export function handlePsychicNoiseEffect(
    defender: Pokemon, 
    logs: {message: string, color: string}[]
) {
    if (defender.isFainted) return;

    // Define o status. 2 Turnos (duração oficial de Psychic Noise)
    defender.statusEffects[HEAL_BLOCK_KEY] = { turns: 2 };
    
    log(logs, BATTLE_MESSAGES.HEAL_BLOCK_START(defender.name), 'text-indigo-600 font-bold italic');
}

/**
 * Verifica se o Pokémon está sob efeito de Bloqueio de Cura.
 */
export function isHealBlocked(pokemon: Pokemon): boolean {
    return !!pokemon.statusEffects[HEAL_BLOCK_KEY];
}

/**
 * Processa o contador de turnos no final do round.
 */
export function handleHealBlockTurnEnd(pokemon: Pokemon) {
    if (pokemon.statusEffects[HEAL_BLOCK_KEY]) {
        pokemon.statusEffects[HEAL_BLOCK_KEY].turns--;
        if (pokemon.statusEffects[HEAL_BLOCK_KEY].turns <= 0) {
            delete pokemon.statusEffects[HEAL_BLOCK_KEY];
        }
    }
}

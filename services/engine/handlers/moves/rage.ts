
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Inicia o estado de Fúria (Rage).
 * O Pokémon fica marcado para receber boosts de ataque se for atingido.
 */
export function handleRageStart(attacker: Pokemon, logs: {message: string, color: string}[]) {
    // Define um status volátil que dura até que o Pokémon selecione outro movimento
    // No motor atual, dura pelo menos o turno do oponente
    attacker.statusEffects['rage-active'] = { turns: 1 };
}

/**
 * Reação ao ser atingido enquanto Fúria está ativa.
 * Aumenta o Ataque em 1 estágio.
 */
export function handleRageOnHit(defender: Pokemon, logs: {message: string, color: string}[]) {
    if (defender.statusEffects['rage-active'] && !defender.isFainted) {
        if (defender.statStages.attack < 6) {
            defender.statStages.attack++;
            log(logs, BATTLE_MESSAGES.RAGE_BUILDING(defender.name), 'text-red-600 font-bold italic');
        }
    }
}

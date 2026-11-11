
import { Pokemon, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Effects from '../../../effectHandlers';

/**
 * Lógica para o movimento Fúria Ardente (Raging Fury).
 * Regra Oficial: O usuário ataca por 2-3 turnos seguidos e depois fica confuso.
 * Mecânica idêntica ao Ultraje (Outrage), Tumulto (Thrash) e Dança das Pétalas (Petal Dance).
 */
export function processRagingFuryLock(attacker: Pokemon, logs: {message: string, color: string}[], state?: BattleState) {
    if (attacker.isFainted) return;

    // Se ainda não está travado, inicia o contador
    if (!attacker.statusEffects['raging-fury-lock']) {
        const duration = Math.floor(Math.random() * 2) + 2; // 2 ou 3 turnos
        attacker.statusEffects['raging-fury-lock'] = { turns: duration };
        attacker.lockedMove = 'raging-fury';
    } else {
        // Decrementa o contador de turnos restantes
        const lock = attacker.statusEffects['raging-fury-lock'];
        lock.turns--;

        // Se chegou ao último turno do combo (1), libera e confunde
        if (lock.turns <= 1) {
            delete attacker.statusEffects['raging-fury-lock'];
            attacker.lockedMove = null;
            
            log(logs, BATTLE_MESSAGES.OUTRAGE_CONFUSION(attacker.name), 'text-purple-600 italic');
            
            // Aplica confusão (usa o helper central que lida com imunidades/habilidades)
            Effects.applyStatus(attacker, 'confusion', logs as any, attacker, false, state);
        }
    }
}

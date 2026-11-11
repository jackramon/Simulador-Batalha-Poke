
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

const ROLLOUT_KEY = 'rollout-streak';

/**
 * Calcula o poder atual da Rolagem.
 * Regra: Base 30. Dobra a cada turno. Dobra se Defense Curl foi usado.
 */
export function getRolloutPower(attacker: Pokemon, basePower: number): number {
    const streakData = attacker.statusEffects[ROLLOUT_KEY];
    const streak = streakData ? streakData.turns : 0;
    
    // Potência base: 30 * 2^(streak)
    // Streak 0 (1º turno): 30
    // Streak 1 (2º turno): 60
    // Streak 2 (3º turno): 120
    // ...
    let power = basePower * Math.pow(2, streak);

    // Bônus de Defense Curl (Geralmente Defense Curl não é implementado como status visual completo no simulador, 
    // mas se fosse, checaríamos aqui. Para compatibilidade, checamos se existe o status ou se foi usado e guardado).
    // Assumimos que se Defense Curl for implementado no futuro, deixará um status 'defense-curl-active'.
    if (attacker.statusEffects['defense-curl-active']) {
        power *= 2;
    }

    return power;
}

/**
 * Inicializa ou incrementa o contador de Rolagem.
 * Trava o usuário no movimento.
 */
export function handleRolloutLock(attacker: Pokemon, logs: {message: string, color: string}[]) {
    if (attacker.isFainted) return;

    if (!attacker.statusEffects[ROLLOUT_KEY]) {
        // Primeiro uso - Inicializa com 1 pois o primeiro hit já ocorreu
        attacker.statusEffects[ROLLOUT_KEY] = { turns: 1 };
        attacker.lockedMove = 'rollout';
        log(logs, `${attacker.name} começou a rolar!`, 'text-gray-600 font-bold');
    } else {
        // Incrementa o contador
        attacker.statusEffects[ROLLOUT_KEY].turns++;
        const currentTurn = attacker.statusEffects[ROLLOUT_KEY].turns;
        
        log(logs, BATTLE_MESSAGES.ROLLOUT_MOMENTUM(), 'text-orange-600 font-bold italic');

        // Se completou 5 turnos (1 a 5), reseta
        if (currentTurn >= 5) {
            resetRollout(attacker);
        }
    }
}

/**
 * Reseta a Rolagem (erro ou fim da sequência).
 */
export function resetRollout(attacker: Pokemon) {
    if (attacker.statusEffects[ROLLOUT_KEY]) {
        delete attacker.statusEffects[ROLLOUT_KEY];
    }
    if (attacker.lockedMove === 'rollout') {
        attacker.lockedMove = null;
    }
}

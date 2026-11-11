
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

const FURY_CUTTER_KEY = 'fury-cutter-streak';

/**
 * Calcula o poder atual do Cortador de Fúria com base na sequência de acertos.
 * Base: 40 -> 80 -> 160 (Max)
 */
export function getFuryCutterPower(attacker: Pokemon, basePower: number): number {
    const streak = attacker.statusEffects[FURY_CUTTER_KEY]?.damageAccumulated || 0;
    // 40 * (2^streak)
    const multiplier = Math.pow(2, streak);
    const power = basePower * multiplier;
    
    return Math.min(160, power);
}

/**
 * Incrementa o contador de sequência após um acerto bem-sucedido.
 */
export function incrementStreak(attacker: Pokemon, logs: {message: string, color: string}[]) {
    const currentStreak = attacker.statusEffects[FURY_CUTTER_KEY]?.damageAccumulated || 0;
    
    // Se ainda não chegou no cap (streak 2 = 160 power), incrementa
    if (currentStreak < 2) {
        attacker.statusEffects[FURY_CUTTER_KEY] = { 
            turns: 1, // Mantemos 1 para indicar que é volátil, mas a lógica de persistência é manual em moves.ts
            damageAccumulated: currentStreak + 1 
        };
        log(logs, BATTLE_MESSAGES.FURY_CUTTER_BUILDUP(), 'text-indigo-600 font-bold italic');
    } else {
        // Mantém ativo no máximo
        attacker.statusEffects[FURY_CUTTER_KEY] = { 
            turns: 1, 
            damageAccumulated: currentStreak 
        };
    }
}

/**
 * Reseta o contador de sequência (erro ou troca de golpe).
 */
export function resetStreak(attacker: Pokemon) {
    if (attacker.statusEffects[FURY_CUTTER_KEY]) {
        delete attacker.statusEffects[FURY_CUTTER_KEY];
    }
}

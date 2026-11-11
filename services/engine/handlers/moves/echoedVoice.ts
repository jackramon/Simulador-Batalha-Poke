
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

const ECHOED_VOICE_KEY = 'echoed-voice-streak';

/**
 * Calcula o poder atual da Voz Ecoante com base na sequência de turnos.
 * Base: 40 -> 80 -> 120 -> 160 -> 200 (Max)
 */
export function getEchoedVoicePower(attacker: Pokemon, basePower: number): number {
    const streak = attacker.statusEffects[ECHOED_VOICE_KEY]?.damageAccumulated || 0;
    
    // Cada uso aumenta em 40 o poder base
    const bonus = streak * 40;
    const power = basePower + bonus;
    
    return Math.min(200, power);
}

/**
 * Incrementa o contador de sequência após um uso bem-sucedido.
 */
export function incrementStreak(attacker: Pokemon, logs: {message: string, color: string}[]) {
    const currentStreak = attacker.statusEffects[ECHOED_VOICE_KEY]?.damageAccumulated || 0;
    
    // Se ainda não chegou no cap (streak 4 = 200 power), incrementa
    if (currentStreak < 4) {
        attacker.statusEffects[ECHOED_VOICE_KEY] = { 
            turns: 1, 
            damageAccumulated: currentStreak + 1 
        };
        log(logs, BATTLE_MESSAGES.ECHOED_VOICE_BUILDUP(), 'text-indigo-600 font-bold italic');
    } else {
        // Mantém ativo no máximo
        attacker.statusEffects[ECHOED_VOICE_KEY] = { 
            turns: 1, 
            damageAccumulated: currentStreak 
        };
    }
}

/**
 * Reseta o contador de sequência (erro ou troca de golpe).
 */
export function resetStreak(attacker: Pokemon) {
    if (attacker.statusEffects[ECHOED_VOICE_KEY]) {
        delete attacker.statusEffects[ECHOED_VOICE_KEY];
    }
}

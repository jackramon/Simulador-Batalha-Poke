
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

const HEAL_BLOCK_KEY = 'heal-block';

/**
 * Lógica para o movimento Bloqueio de Cura (Heal Block).
 * Regra Oficial: Impede o alvo de usar movimentos de cura, habilidades de cura
 * e itens de cura por 5 turnos.
 * Falha se o alvo já estiver sob efeito de Bloqueio de Cura.
 */
export function handleHealBlock(attacker: Pokemon, defender: Pokemon, logs: LogEntry[]) {
    if (defender.isFainted) return;

    if (defender.statusEffects[HEAL_BLOCK_KEY]) {
        log(logs, `Mas falhou! ${defender.name} já está impedido de se curar.`, 'text-gray-500 italic');
        return;
    }

    // Aplica o status de bloqueio de cura
    // Duração: 5 turnos
    defender.statusEffects[HEAL_BLOCK_KEY] = { 
        turns: 5,
        sourceMoveName: 'heal-block'
    };

    log(logs, BATTLE_MESSAGES.HEAL_BLOCK_START(defender.name), 'text-purple-600 font-bold italic');
}

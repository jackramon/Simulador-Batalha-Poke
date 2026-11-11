
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

// Habilidades que não podem ser suprimidas (Gen 9)
const UNSUPPRESSABLE_ABILITIES = [
    'as-one', 'battle-bond', 'comatose', 'commander', 'disguise', 
    'gulp-missile', 'hadron-engine', 'ice-face', 'multitype', 
    'orichalcum-pulse', 'power-construct', 'protosynthesis', 
    'quark-drive', 'rks-system', 'schooling', 'shields-down', 
    'stance-change', 'tera-shift', 'zen-mode', 'zero-to-hero'
];

/**
 * Lógica para o movimento Execução Central (Core Enforcer).
 * Regra Oficial: Se o usuário atacou DEPOIS do alvo (ou se o alvo usou um movimento no mesmo turno),
 * a habilidade do alvo é suprimida até que ele saia de campo.
 */
export function handleCoreEnforcerEffect(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // Verifica se o alvo já agiu neste turno
    if (defender.movedThisTurn) {
        // Verifica se a habilidade pode ser suprimida
        if (UNSUPPRESSABLE_ABILITIES.includes(defender.ability)) {
            return;
        }

        // Aplica o status de supressão (usando a chave padrão 'gastro-acid' para compatibilidade)
        if (!defender.statusEffects['gastro-acid']) {
            defender.statusEffects['gastro-acid'] = { turns: -1 };
            log(logs, BATTLE_MESSAGES.ABILITY_SUPPRESSED(defender.name), 'text-purple-600 font-bold italic');
        }
    }
}

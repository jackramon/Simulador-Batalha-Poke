
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
 * Lógica para o movimento Ácido Gástrico (Gastro Acid).
 * Regra Oficial: Suprime a habilidade do alvo até que ele saia de campo.
 * Falha se o alvo já estiver sob efeito de Gastro Acid ou se a habilidade não puder ser suprimida.
 */
export function handleGastroAcid(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Verifica se já está suprimido
    if (defender.statusEffects['gastro-acid']) {
        log(logs, `Mas falhou! A habilidade de ${defender.name} já está suprimida.`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica se a habilidade é imune
    if (UNSUPPRESSABLE_ABILITIES.includes(defender.ability)) {
        log(logs, `Mas falhou! A habilidade de ${defender.name} não pode ser suprimida.`, 'text-gray-500 italic');
        return;
    }

    // 3. Aplica o efeito
    defender.statusEffects['gastro-acid'] = { turns: -1 };
    log(logs, `A habilidade de ${defender.name} foi suprimida!`, 'text-purple-600 font-bold italic');
}

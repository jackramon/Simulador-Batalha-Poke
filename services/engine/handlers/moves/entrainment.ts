
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { ABILITY_EFFECTS } from '../../../../data/abilities';

// Habilidades que o usuário NÃO pode passar (Origem Inválida)
const BANNED_SOURCE_ABILITIES = [
    'trace', 'forecast', 'flower-gift', 'wonder-guard', 'illusion', 
    'imposter', 'stance-change', 'power-of-alchemy', 'receiver', 
    'schooling', 'comatose', 'shields-down', 'disguise', 'rks-system', 
    'battle-bond', 'power-construct', 'ice-face', 'gulp-missile', 
    'neutralizing-gas', 'zen-mode', 'hunger-switch', 'as-one', 
    'zero-to-hero', 'commander', 'protosynthesis', 'quark-drive', 
    'orichalcum-pulse', 'hadron-engine', 'tera-shift', 'tera-shell', 
    'teraform-zero', 'poison-puppeteer'
];

// Habilidades que o alvo NÃO pode perder (Alvo Inválido)
const BANNED_TARGET_ABILITIES = [
    'truant', 'multitype', 'stance-change', 'schooling', 'comatose', 
    'shields-down', 'disguise', 'rks-system', 'battle-bond', 
    'power-construct', 'ice-face', 'gulp-missile', 'zen-mode', 
    'hunger-switch', 'as-one', 'zero-to-hero', 'commander', 
    'protosynthesis', 'quark-drive', 'orichalcum-pulse', 
    'hadron-engine', 'tera-shift', 'tera-shell', 'teraform-zero', 
    'poison-puppeteer'
];

/**
 * Lógica para o movimento Entretenimento (Entrainment).
 * Efeito: Muda a habilidade do alvo para ser igual à do usuário.
 */
export function handleEntrainment(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Verifica se o usuário tem uma habilidade que não pode ser copiada
    if (BANNED_SOURCE_ABILITIES.includes(attacker.ability)) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica se o alvo tem uma habilidade que não pode ser substituída
    if (BANNED_TARGET_ABILITIES.includes(defender.ability)) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }

    // 3. Verifica se o alvo já tem a mesma habilidade
    if (defender.ability === attacker.ability) {
        log(logs, `Mas falhou! ${defender.name} já tem essa habilidade.`, 'text-gray-500 italic');
        return;
    }
    
    // 4. Verifica se o alvo está na forma Dynamax (Não aplicável ao simulador atual, mas bom manter em mente)
    // No futuro, adicionar verificação de isDynamaxed aqui.

    // Executa a mudança
    const newAbilityName = ABILITY_EFFECTS[attacker.ability]?.name || attacker.ability;
    defender.ability = attacker.ability;

    log(logs, `${defender.name} adquiriu ${newAbilityName}!`, 'text-pink-600 font-bold italic');
}

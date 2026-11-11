
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Habilidades que não podem ser substituídas por Worry Seed (Gen 9).
 */
const BANNED_ABILITIES = [
    'insomnia', 'truant', 'multitype', 'stance-change', 'schooling',
    'comatose', 'shields-down', 'disguise', 'rks-system', 'battle-bond',
    'power-construct', 'ice-face', 'gulp-missile', 'zero-to-hero',
    'commander', 'protosynthesis', 'quark-drive', 'orichalcum-pulse',
    'hadron-engine', 'tera-shift', 'tera-shell', 'teraform-zero',
    'poison-puppeteer', 'as-one', 'zen-mode'
];

/**
 * Lógica para o movimento Semente da Preocupação (Worry Seed).
 * Regra Oficial: Muda a habilidade do alvo para Insônia (Insomnia).
 */
export function handleWorrySeed(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Verifica se a habilidade é proibida
    if (BANNED_ABILITIES.includes(defender.ability)) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }

    // 2. Aplica a mudança
    defender.ability = 'insomnia';

    log(logs, `${defender.name} adquiriu a Habilidade Insônia!`, 'text-green-600 font-bold italic');
}

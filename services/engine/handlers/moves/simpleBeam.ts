
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';

const BANNED_TARGET_ABILITIES = [
    'simple', 'truant', 'multitype', 'stance-change', 'schooling',
    'comatose', 'shields-down', 'disguise', 'rks-system', 'battle-bond',
    'power-construct', 'ice-face', 'gulp-missile', 'zero-to-hero',
    'commander', 'protosynthesis', 'quark-drive', 'orichalcum-pulse',
    'hadron-engine', 'tera-shift', 'tera-shell', 'teraform-zero',
    'poison-puppeteer', 'as-one'
];

export function handleSimpleBeam(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    if (BANNED_TARGET_ABILITIES.includes(defender.ability)) {
        log(logs, `Mas falhou!`, 'text-gray-500 italic');
        return;
    }

    defender.ability = 'simple';
    log(logs, `${defender.name} adquiriu a Habilidade Simples!`, 'text-indigo-600 font-bold italic');
}

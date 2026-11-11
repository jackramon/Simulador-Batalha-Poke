
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { ABILITY_EFFECTS } from '../../../../data/abilities';

/**
 * Habilidades que não podem ser trocadas via Skill Swap (Gen 9).
 */
const BANNED_ABILITIES = [
    'wonder-guard', 'multitype', 'illusion', 'stance-change', 'schooling', 
    'comatose', 'shields-down', 'disguise', 'rks-system', 'battle-bond', 
    'power-construct', 'ice-face', 'gulp-missile', 'neutralizing-gas', 
    'hunger-switch', 'as-one', 'zero-to-hero', 'commander', 'protosynthesis', 
    'quark-drive', 'orichalcum-pulse', 'hadron-engine', 'tera-shift', 
    'tera-shell', 'teraform-zero', 'poison-puppeteer'
];

/**
 * Lógica para o movimento Troca de Habilidade (Skill Swap).
 * Regra Oficial: Troca as habilidades do usuário e do alvo.
 */
export function handleSkillSwap(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.isFainted) return;

    // 1. Verifica se alguma das habilidades é proibida
    if (BANNED_ABILITIES.includes(attacker.ability) || BANNED_ABILITIES.includes(defender.ability)) {
        log(logs, `Mas falhou! Uma das habilidades não pode ser trocada.`, 'text-gray-500 italic');
        return;
    }

    // 2. Verifica se as habilidades são iguais
    if (attacker.ability === defender.ability) {
        log(logs, `Mas falhou! Ambos já têm a mesma habilidade.`, 'text-gray-500 italic');
        return;
    }

    // 3. Executa a troca
    const attackerOldAbility = attacker.ability;
    const defenderOldAbility = defender.ability;

    attacker.ability = defenderOldAbility;
    defender.ability = attackerOldAbility;

    const attackerNewName = ABILITY_EFFECTS[attacker.ability]?.name || attacker.ability;
    const defenderNewName = ABILITY_EFFECTS[defender.ability]?.name || defender.ability;

    log(logs, `${attacker.name} trocou habilidades com o alvo!`, 'text-purple-600 font-bold');
    log(logs, `${attacker.name} adquiriu ${attackerNewName}!`, 'text-indigo-500 italic text-xs');
    log(logs, `${defender.name} adquiriu ${defenderNewName}!`, 'text-indigo-500 italic text-xs');
}

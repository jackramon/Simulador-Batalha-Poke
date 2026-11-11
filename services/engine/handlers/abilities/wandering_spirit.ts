
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { ABILITY_EFFECTS } from '../../../../data/abilities';

/**
 * Lista de habilidades que não podem ser trocadas por Espírito Vagante (Wandering Spirit).
 * Baseado nas restrições oficiais (Gen 9).
 */
const NON_SWAPPABLE_ABILITIES = [
    'wandering-spirit', 'mummy', 'lingering-aroma', 'trace', 'illusion', 
    'zen-mode', 'schooling', 'shields-down', 'comatose', 'disguise', 
    'gulp-missile', 'ice-face', 'zero-to-hero', 'commander', 
    'neutralizing-gas', 'as-one', 'tera-shift', 'tera-shell', 
    'teraform-zero', 'poison-puppeteer', 'multitype', 'rks-system', 
    'hunger-switch', 'battle-bond', 'commander', 'protosynthesis', 'quark-drive'
];

/**
 * Lógica para a habilidade Espírito Vagante (Wandering Spirit).
 * Quando atingido por um movimento de contato, troca habilidades com o atacante.
 */
export function handleWanderingSpirit(attacker: Pokemon, defender: Pokemon, isContact: boolean, logs: {message: string, color: string}[]) {
    if (!isContact || defender.ability !== 'wandering-spirit' || defender.isFainted || attacker.isFainted) {
        return;
    }

    // Verifica se a habilidade do atacante pode ser trocada
    if (attacker.ability && !NON_SWAPPABLE_ABILITIES.includes(attacker.ability)) {
        const attackerAbility = attacker.ability;
        const defenderAbility = defender.ability;

        const attackerAbilityName = ABILITY_EFFECTS[attackerAbility]?.name || attackerAbility;
        const defenderAbilityName = ABILITY_EFFECTS[defenderAbility]?.name || defenderAbility;

        // Executa a troca
        attacker.ability = defenderAbility;
        defender.ability = attackerAbility;

        log(logs, `${defender.name} trocou sua habilidade ${defenderAbilityName} pela habilidade ${attackerAbilityName} de ${attacker.name}!`, 'text-purple-600 italic font-bold');
    }
}

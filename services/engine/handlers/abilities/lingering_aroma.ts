
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import { ABILITY_EFFECTS } from '../../../../data/abilities';

/**
 * Lista de habilidades que não podem ser alteradas por Aroma Persistente ou Múmia.
 * Baseado nas regras oficiais (Gen 9).
 */
const NON_CHANGEABLE_ABILITIES = [
    'lingering-aroma', 'mummy', 'battle-bond', 'comatose', 'disguise',
    'gulp-missile', 'ice-face', 'multitype', 'power-construct', 'rks-system',
    'schooling', 'shields-down', 'stance-change', 'zen-mode', 'zero-to-hero',
    'commander', 'neutralizing-gas', 'as-one', 'tera-shift', 'tera-shell', 'teraform-zero'
];

/**
 * Lógica para as habilidades Aroma Persistente e Múmia.
 * Quando o Pokémon é atingido por um movimento de contato, a habilidade do atacante
 * torna-se Aroma Persistente (ou Múmia).
 */
export function handleLingeringAroma(attacker: Pokemon, defender: Pokemon, isContact: boolean, logs: {message: string, color: string}[]) {
    if (!isContact || attacker.isFainted || defender.isFainted) return;

    // Ambas as habilidades funcionam da mesma forma
    const trappingAbility = defender.ability === 'mummy' ? 'mummy' : 'lingering-aroma';

    if ((defender.ability === 'lingering-aroma' || defender.ability === 'mummy') && 
        !NON_CHANGEABLE_ABILITIES.includes(attacker.ability)) {
        
        const oldAbilityName = ABILITY_EFFECTS[attacker.ability]?.name || attacker.ability;
        const newAbilityName = ABILITY_EFFECTS[trappingAbility]?.name || trappingAbility;

        attacker.ability = trappingAbility;
        
        log(logs, `${attacker.name} entrou em contato com o aroma de ${defender.name}! Sua habilidade ${oldAbilityName} virou ${newAbilityName}!`, 'text-purple-600 italic');
    }
}

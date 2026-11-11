
import { Pokemon } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Armadura Espelhada (Mirror Armor).
 * Regra Oficial: Reflete quaisquer efeitos de redução de atributos causados
 * por movimentos ou habilidades do oponente.
 */
export function shouldReflect(
    target: Pokemon, 
    ignoresAbilities: boolean, 
    logs: {message: string, color: string}[]
): boolean {
    if (target.ability === 'mirror-armor' && !target.isFainted && !ignoresAbilities) {
        log(logs, `A Armadura Espelhada de ${target.name} refletiu a redução de atributos!`, 'text-indigo-600 font-bold');
        return true;
    }
    return false;
}

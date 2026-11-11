
import { Pokemon } from '../../../../types';
import { log } from '../../utils';
import * as InnerFocus from '../abilities/inner_focus';

/**
 * Lógica para o movimento Pisão (Stomp).
 * Regra Oficial: 
 * 1. O poder base dobra (65 -> 130) se o alvo usou Minimizar.
 * 2. 30% de chance de causar flinch.
 */

export function getStompPower(defender: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    // Verifica se o alvo está minimizado
    // O status 'minimize' é definido em statChanges.ts quando o movimento Minimize é usado
    const isMinimized = !!defender.statusEffects['minimize'];
    
    return {
        power: isMinimized ? basePower * 2 : basePower,
        isBoosted: isMinimized
    };
}

export function handleStompFlinch(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: {message: string, color: string}[],
    ignoresAbilities: boolean
) {
    if (defender.isFainted) return;

    // Inner Focus impede o recuo, a menos que o atacante tenha Mold Breaker
    if (!InnerFocus.isImmuneToFlinch(defender) || ignoresAbilities) {
        defender.isFlinched = true;
        // O log de flinch geralmente aparece quando o pokemon tenta atacar (na função checkStatusBlocking),
        // mas em movimentos com chance secundária como Stomp, o efeito é silencioso até a verificação do turno seguinte.
    } else {
        log(logs, `${defender.name} protegeu-se do recuo com seu Foco Interno!`, 'text-gray-500 italic text-xs');
    }
}

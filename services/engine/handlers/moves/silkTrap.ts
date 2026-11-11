
import { Pokemon, LogEntry } from '../../../../types';
import { log } from '../../utils';
import * as StatChanges from '../effects/statChanges';

/**
 * Lógica para o efeito de contato da Armadilha de Seda (Silk Trap).
 * Regra Oficial: Se o usuário for atingido por um movimento de contato enquanto protegido,
 * a Velocidade do atacante é reduzida em 1 estágio.
 */
export function handleContact(
    defender: Pokemon, 
    attacker: Pokemon, 
    logs: LogEntry[]
) {
    if (defender.statusEffects['silk-trap']) {
        log(logs, `A Armadilha de Seda de ${defender.name} emaranhou o atacante!`, 'text-green-600 font-bold italic');
        
        // Reduz Velocidade do atacante em 1 estágio
        // isOpponentSource = true (vem da armadilha do defensor)
        // ignoresAbilities = false (habilidades defensivas como Clear Body protegem)
        StatChanges.applyMoveStatChange(
            attacker,
            'speed-down',
            logs,
            true,
            false,
            'silk-trap'
        );
    }
}

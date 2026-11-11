import { Pokemon, LogEntry, BattleState } from '../../../../types';
import { log } from '../../utils';
import { applyMoveStatChange } from './statChanges';

/**
 * Lógica para o movimento Fluxo Magnético (Magnetic Flux).
 * Aumenta a Defesa e a Defesa Especial do usuário em 1 estágio se ele tiver a habilidade Plus ou Minus.
 * Em batalhas em dupla, afetaria os aliados com essas habilidades, mas em 1v1, afeta apenas o usuário.
 */
export function handleMagneticFlux(
    attacker: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    // Verifica se o usuário tem a habilidade Plus ou Minus
    if (attacker.ability === 'plus' || attacker.ability === 'minus') {
        // Aumenta a Defesa
        applyMoveStatChange(attacker, 'defense-up', logs, false, false, 'magnetic-flux', state);
        
        // Aumenta a Defesa Especial
        applyMoveStatChange(attacker, 'spDefense-up', logs, false, false, 'magnetic-flux', state);
    } else {
        log(logs, `Mas falhou! ${attacker.name} não possui a habilidade Plus ou Minus.`, 'text-gray-500 italic');
    }
}

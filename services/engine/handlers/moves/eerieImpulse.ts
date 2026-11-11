
import { Pokemon, BattleState, LogEntry } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as MoldBreaker from '../abilities/mold_breaker';

/**
 * Lógica para o movimento Impulso Estranho (Eerie Impulse).
 * Regra Oficial: Reduz o Ataque Especial do alvo em 2 estágios.
 */
export function handleEerieImpulse(
    attacker: Pokemon,
    defender: Pokemon,
    logs: LogEntry[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    // Aplica redução de Atq. Especial (-2)
    // O parâmetro 'isOpponentSource' é true pois é um efeito causado pelo atacante no defensor.
    // O nome do movimento 'eerie-impulse' é passado para que o statChanges.ts aplique a magnitude correta (2).
    StatChanges.applyMoveStatChange(
        defender,
        'spAttack-down',
        logs,
        true, 
        ignoresAbilities,
        'eerie-impulse',
        state
    );
}

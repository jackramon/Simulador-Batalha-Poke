
import { Pokemon, BattleState } from '../../../../types';
import * as StatChanges from '../effects/statChanges';
import * as MoldBreaker from '../abilities/mold_breaker';

/**
 * Lógica para o movimento Bolhas (Bubble).
 * Regra Oficial: Causa dano e tem 10% de chance de reduzir a Velocidade do alvo em 1 estágio.
 */
export function handleBubbleEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Verifica se o atacante tem habilidade que ignora proteções de status (ex: Mold Breaker vs Clear Body)
    const ignoresAbilities = MoldBreaker.suppressesAbilities(attacker.ability);

    // Aplica redução de Velocidade (-1)
    // O parâmetro 'isOpponentSource' é true pois é um efeito causado pelo atacante no defensor.
    StatChanges.applyMoveStatChange(
        defender,
        'speed-down',
        logs,
        true, 
        ignoresAbilities,
        'bubble',
        state
    );
}

import { Pokemon, BattleState } from '../../../../types';
import * as StatMoves from './statChanges';

/**
 * Lógica para o efeito secundário do Tiro de Escama (Scale Shot).
 * Regra Oficial: Aumenta a Velocidade do usuário em 1 estágio e reduz sua Defesa em 1 estágio.
 */
export function applyScaleShotStats(attacker: Pokemon, logs: {message: string, color: string}[], state?: BattleState) {
    // Note: No Scale Shot, as mudanças de status ocorrem no PRÓPRIO atacante.
    // O parâmetro isOpponentSource é falso pois o efeito vem do próprio movimento do usuário.
    StatMoves.applyMoveStatChange(attacker, 'speed-up', logs, false, false, 'scale-shot', state);
    StatMoves.applyMoveStatChange(attacker, 'defense-down', logs, false, false, 'scale-shot', state);
}

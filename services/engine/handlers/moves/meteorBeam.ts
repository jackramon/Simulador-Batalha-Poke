
import { Pokemon, BattleState } from '../../../../types';
import * as StatMoves from './statChanges';

/**
 * Lógica para o turno de carregamento do Raio de Meteoro.
 * Regra Oficial: Aumenta o Ataque Especial em 1 estágio antes de atacar no próximo turno.
 */
export function handleChargeBoost(attacker: Pokemon, logs: {message: string, color: string}[], state: BattleState) {
    StatMoves.applyMoveStatChange(attacker, 'spAttack-up', logs, false, false, 'meteor-beam', state);
}

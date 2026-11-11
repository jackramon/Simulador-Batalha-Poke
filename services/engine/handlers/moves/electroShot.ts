
import { Pokemon, BattleState } from '../../../../types';
import * as StatMoves from './statChanges';

/**
 * Lógica para o Disparo Elétrico (Electro Shot).
 * Regra Oficial: Aumenta o Ataque Especial em 1 estágio.
 * Este efeito ocorre no turno de carga (ou imediatamente na chuva).
 */
export function handleChargeBoost(attacker: Pokemon, logs: {message: string, color: string}[], state: BattleState) {
    StatMoves.applyMoveStatChange(
        attacker, 
        'spAttack-up', 
        logs, 
        false, // isOpponentSource
        false, // ignoresAbilities
        'electro-shot', 
        state
    );
}

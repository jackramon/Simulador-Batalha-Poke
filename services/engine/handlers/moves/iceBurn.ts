
import { Pokemon, BattleState } from '../../../../types';
import * as StatusConditions from '../effects/statusConditions';

/**
 * Lógica para o movimento Chama de Gelo (Ice Burn).
 * Tipo: Gelo
 * Categoria: Especial (Kyurem-White)
 * Poder: 140
 * Precisão: 90
 * Efeito: 
 * 1. Carrega no primeiro turno (tratado via TWO_TURN_MOVES no pipeline).
 * 2. Causa dano e tem 30% de chance de QUEIMAR (Burn) o alvo.
 */
export function handleIceBurnEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica Queimadura
    StatusConditions.applyStatus(
        defender, 
        'burn', 
        logs as any, 
        attacker, 
        false, // isFromSynchronize
        state
    );
}

// O mesmo arquivo pode conter Freeze Shock por similaridade temática (Kyurem)
/**
 * Lógica para o movimento Choque Gélido (Freeze Shock).
 * Tipo: Gelo
 * Categoria: Físico (Kyurem-Black)
 * Poder: 140
 * Precisão: 90
 * Efeito: 
 * 1. Carrega no primeiro turno.
 * 2. Causa dano e tem 30% de chance de PARALISAR o alvo.
 */
export function handleFreezeShockEffect(
    attacker: Pokemon,
    defender: Pokemon,
    logs: {message: string, color: string}[],
    state?: BattleState
) {
    if (defender.isFainted) return;

    // Aplica Paralisia
    StatusConditions.applyStatus(
        defender, 
        'paralysis', 
        logs as any, 
        attacker, 
        false, // isFromSynchronize
        state
    );
}

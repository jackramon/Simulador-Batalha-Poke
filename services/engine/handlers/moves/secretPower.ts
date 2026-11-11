
import { Pokemon, BattleState } from '../../../../types';
import * as Effects from '../../../effectHandlers';
import * as StatMoves from './statChanges';

/**
 * Lógica para o movimento Poder Secreto (Secret Power).
 * O efeito secundário depende do Terreno (Generation 7+ mechanics).
 * - Electric Terrain: Paralisia (30%)
 * - Grassy Terrain: Sono (30%)
 * - Misty Terrain: Sp. Attack -1 (30%)
 * - Psychic Terrain: Speed -1 (30%)
 * - Nenhum (Wi-Fi/Link Battle default): Paralisia (30%)
 */
export function handleSecretPower(
    attacker: Pokemon, 
    defender: Pokemon, 
    logs: {message: string, color: string}[], 
    state?: BattleState,
    ignoresAbilities: boolean = false
) {
    if (!state || defender.isFainted) return;

    const terrain = state.terrain;

    if (terrain === 'electric') {
        Effects.applyStatus(defender, 'paralysis', logs as any, attacker);
    } else if (terrain === 'grassy') {
        Effects.applyStatus(defender, 'sleep', logs as any, attacker);
    } else if (terrain === 'misty') {
        StatMoves.applyMoveStatChange(
            defender, 
            'spAttack-down', 
            logs, 
            true, // isOpponentSource
            ignoresAbilities, 
            'secret-power', 
            state
        );
    } else if (terrain === 'psychic') {
        StatMoves.applyMoveStatChange(
            defender, 
            'speed-down', 
            logs, 
            true, // isOpponentSource
            ignoresAbilities, 
            'secret-power', 
            state
        );
    } else {
        // Terreno Padrão / Nenhum
        Effects.applyStatus(defender, 'paralysis', logs as any, attacker);
    }
}

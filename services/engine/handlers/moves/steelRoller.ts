
import { BattleState, Pokemon } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Verifica se o Rolo de Aço (Steel Roller) vai falhar.
 * Regra Oficial: O movimento falha se não houver um Terreno ativo no campo.
 */
export function checkFailure(
    attacker: Pokemon, 
    state: BattleState, 
    logs: {message: string, color: string}[]
): boolean {
    if (state.terrain === 'none') {
        log(logs, BATTLE_MESSAGES.STEEL_ROLLER_FAIL(attacker.name), 'text-gray-500 italic');
        return true;
    }
    return false;
}

/**
 * Executa o efeito secundário de remover o terreno.
 */
export function handleTerrainRemoval(
    state: BattleState,
    logs: {message: string, color: string}[]
) {
    if (state.terrain !== 'none') {
        state.terrain = 'none';
        state.terrainTurns = 0;
        log(logs, BATTLE_MESSAGES.TERRAIN_REMOVED(), 'text-gray-600 font-bold');
    }
}

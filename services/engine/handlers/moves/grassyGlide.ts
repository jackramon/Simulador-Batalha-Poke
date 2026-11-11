
import { Pokemon, BattleState } from '../../../../types';
import * as Terrain from '../terrain';

/**
 * Lógica para o movimento Deslize na Grama (Grassy Glide).
 * Regra Oficial: Ganha +1 de prioridade se o Campo Gramado (Grassy Terrain) estiver ativo
 * e o usuário estiver aterrado (afetado pelo terreno).
 */
export function getPriorityBoost(attacker: Pokemon, state: BattleState): number {
    // Verifica se o terreno é de grama
    if (state.terrain === 'grassy') {
        // Verifica se o usuário toca o chão (não é voador, não tem levitate, etc)
        if (Terrain.isGrounded(attacker)) {
            return 1;
        }
    }
    return 0;
}

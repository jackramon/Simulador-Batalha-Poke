import { Pokemon, BattleState } from '../../../../types';
import * as Terrain from '../terrain';

/**
 * Lógica para o movimento Força em Expansão (Expanding Force).
 * Regra Oficial: Se o usuário estiver aterrado e o Campo Psíquico estiver ativo,
 * o poder base aumenta em 50% (80 -> 120).
 */
export function getExpandingForcePower(
    attacker: Pokemon, 
    state: BattleState | undefined, 
    basePower: number
): { power: number, isBoosted: boolean } {
    if (!state || state.terrain !== 'psychic') {
        return { power: basePower, isBoosted: false };
    }

    // Verifica se o usuário é afetado pelo terreno (grounded)
    const grounded = Terrain.isGrounded(attacker);
    
    if (grounded) {
        return { power: Math.floor(basePower * 1.5), isBoosted: true };
    }

    return { power: basePower, isBoosted: false };
}
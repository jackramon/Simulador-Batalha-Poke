
import { Pokemon, BattleState } from '../../../../types';
import * as Terrain from '../terrain';

/**
 * Lógica para o movimento Explosão Mística (Misty Explosion).
 * Regra Oficial: 
 * 1. O usuário desmaia ao usar o golpe (tratado via efeito 'self-faint').
 * 2. Se o Campo de Névoa (Misty Terrain) estiver ativo e o usuário for aterrado,
 *    o poder base aumenta em 50% (100 -> 150).
 */
export function getMistyExplosionPower(
    attacker: Pokemon, 
    basePower: number, 
    state?: BattleState
): { power: number, isBoosted: boolean } {
    if (!state || state.terrain !== 'misty') {
        return { power: basePower, isBoosted: false };
    }

    // Verifica se o usuário toca o chão (é afetado pelo terreno)
    if (Terrain.isGrounded(attacker, state)) {
        return { power: Math.floor(basePower * 1.5), isBoosted: true };
    }

    return { power: basePower, isBoosted: false };
}

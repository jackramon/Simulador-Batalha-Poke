
import { Pokemon, BattleState } from '../../../../types';
import * as Terrain from '../terrain';

/**
 * Lógica para o movimento Voltagem Crescente (Rising Voltage).
 * Regra Oficial: Se o alvo estiver no Campo Elétrico (e for afetado por ele/aterrado),
 * o poder base do movimento dobra (70 -> 140).
 */
export function getRisingVoltagePower(
    defender: Pokemon, 
    state: BattleState | undefined, 
    basePower: number
): { power: number, isBoosted: boolean } {
    if (!state || state.terrain !== 'electric') {
        return { power: basePower, isBoosted: false };
    }

    // O boost depende se o ALVO (defender) está tocando o chão no terreno elétrico
    // Passa 'state' para considerar Gravity, Iron Ball, etc.
    const targetGrounded = Terrain.isGrounded(defender, state);
    
    if (targetGrounded) {
        return { power: basePower * 2, isBoosted: true };
    }

    return { power: basePower, isBoosted: false };
}

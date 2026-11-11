
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Raio de Fusão (Fusion Bolt).
 * Regra Oficial: O poder base dobra (100 -> 200) se o último movimento usado no turno
 * por qualquer Pokémon foi Chama de Fusão (Fusion Flare).
 * 
 * Implementação: No 1v1, isso significa que o oponente deve ter atacado primeiro 
 * neste mesmo turno usando Fusion Flare.
 */
export function getFusionBoltPower(defender: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    // Verifica se o oponente já agiu neste turno (moveu-se antes do usuário)
    if (defender.movedThisTurn) {
        // Verifica se o movimento usado foi Fusion Flare
        if (defender.lastMoveUsed?.name === 'fusion-flare') {
            return {
                power: basePower * 2,
                isBoosted: true
            };
        }
    }

    return {
        power: basePower,
        isBoosted: false
    };
}

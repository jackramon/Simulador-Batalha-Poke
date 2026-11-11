
import { Pokemon } from '../../../../types';
import * as Terrain from '../terrain';

/**
 * Retorna o tipo efetivo do Pulso de Terreno.
 * Normal (Padrão) -> Muda dependendo do terreno se o usuário estiver aterrado.
 */
export function getEffectiveType(attacker: Pokemon, terrain: string = 'none'): string {
    if (terrain === 'none' || !Terrain.isGrounded(attacker)) {
        return 'normal';
    }
    switch (terrain) {
        case 'electric': return 'electric';
        case 'grassy': return 'grass';
        case 'misty': return 'fairy'; // Pulso de Terreno vira Fada na Névoa
        case 'psychic': return 'psychic';
        default: return 'normal';
    }
}

/**
 * Calcula o poder do Pulso de Terreno.
 * Base 50 -> Dobra para 100 se o terreno estiver ativo e o usuário for aterrado.
 */
export function getTerrainPulsePower(attacker: Pokemon, basePower: number, terrain: string = 'none'): { power: number, isBoosted: boolean } {
     if (terrain === 'none' || !Terrain.isGrounded(attacker)) {
        return { power: basePower, isBoosted: false };
    }
    // Base 50 -> 100 (Dobra)
    return { power: basePower * 2, isBoosted: true };
}

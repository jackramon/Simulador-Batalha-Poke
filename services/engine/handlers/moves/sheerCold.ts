
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Frio Absoluto (Sheer Cold).
 * Regra Oficial: 
 * 1. Causa OHKO (Nocaute Instantâneo).
 * 2. Pokémon do tipo Gelo são imunes ao movimento.
 * 3. A precisão depende do nível (não tratado aqui, pois o simulador padroniza níveis, usa-se a precisão base de 30%).
 */
export function isImmune(defender: Pokemon): boolean {
    // Pokémon do tipo Gelo são imunes a Sheer Cold
    return defender.types.includes('ice');
}

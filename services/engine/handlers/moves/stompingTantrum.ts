
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Chilique (Stomping Tantrum).
 * Regra Oficial: Dobra o poder base (75 -> 150) se o último movimento usado pelo Pokémon falhou.
 * Falhas incluem: Errar (Miss), ser bloqueado por Protect, falhar por Imunidade, Paralisia, Sono, Flinch, etc.
 */
export function getStompingTantrumPower(attacker: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    const isBoosted = !!attacker.lastMoveFailed;
    
    return {
        power: isBoosted ? basePower * 2 : basePower,
        isBoosted
    };
}

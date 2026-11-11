import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Fachada (Facade).
 * Regra Oficial: O poder base dobra (70 -> 140) se o usuário estiver 
 * sob efeito de Queimadura (Burn), Paralisia (Paralysis) ou Veneno (Poison/Toxic).
 */
export function getFacadePower(attacker: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    const statusList = attacker.statusEffects;
    const isBoosted = !!(statusList.burn || statusList.paralysis || statusList.poison || statusList.toxic);
    
    return {
        power: isBoosted ? basePower * 2 : basePower,
        isBoosted
    };
}


import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Descontar (Lash Out).
 * Regra Oficial: O poder base dobra (75 -> 150) se o usuário teve 
 * algum de seus atributos reduzido durante o turno.
 */
export function getLashOutPower(attacker: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    // Verifica se existe o marcador 'stat-dropped' nos efeitos de status.
    // Este marcador é adicionado em statChanges.ts sempre que um atributo cai.
    const hasDroppedStat = !!attacker.statusEffects['stat-dropped'];
    
    return {
        power: hasDroppedStat ? basePower * 2 : basePower,
        isBoosted: hasDroppedStat
    };
}

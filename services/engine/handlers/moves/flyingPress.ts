
import { Pokemon } from '../../../../types';
import { TYPE_EFFECTIVENESS } from '../../../../data/types';

/**
 * Lógica para o movimento Prensa Voadora (Flying Press).
 * Regras Oficiais:
 * 1. O movimento causa dano Físico.
 * 2. Embora seja do tipo Lutador, a efetividade é calculada combinando Lutador + Voador.
 * 3. Se o alvo usou Minimize, o dano base dobra (100 -> 200) e o golpe nunca erra (tratado em accuracy.ts).
 */

/**
 * Calcula o poder do movimento, dobrando se o alvo estiver minimizado.
 */
export function getPower(defender: Pokemon, basePower: number): number {
    if (defender.statusEffects['minimize']) {
        return basePower * 2;
    }
    return basePower;
}

/**
 * Calcula a efetividade combinada (Dual Type) do Flying Press contra um tipo defensivo.
 * Multiplica a efetividade de Lutador pela efetividade de Voador.
 */
export function getDualTypeEffectiveness(defenderType: string): number {
    const typeLower = defenderType.toLowerCase();
    
    // Efetividade do tipo Lutador
    const fightingEff = TYPE_EFFECTIVENESS['fighting']?.[typeLower] ?? 1.0;
    
    // Efetividade do tipo Voador
    const flyingEff = TYPE_EFFECTIVENESS['flying']?.[typeLower] ?? 1.0;
    
    // Combina as duas
    return fightingEff * flyingEff;
}

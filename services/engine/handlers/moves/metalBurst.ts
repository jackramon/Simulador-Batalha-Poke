
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Explosão Metálica (Metal Burst).
 * Regra Oficial: Se o usuário sofreu dano de um oponente neste turno,
 * causa 1.5x o dano recebido.
 * Diferente de Counter/Mirror Coat, funciona para danos físicos E especiais
 * e não possui prioridade negativa.
 */
export function getMetalBurstDamage(attacker: Pokemon): number {
    // Recupera o dano acumulado neste turno (físico + especial)
    const physDamage = attacker.statusEffects['physical-damage-taken']?.damageAccumulated || 0;
    const specDamage = attacker.statusEffects['special-damage-taken']?.damageAccumulated || 0;
    
    const totalDamage = physDamage + specDamage;

    if (totalDamage === 0) return 0;

    return Math.floor(totalDamage * 1.5);
}

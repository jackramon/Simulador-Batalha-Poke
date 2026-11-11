
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Merecido (Comeuppance).
 * Regra Oficial: Se o usuário sofreu dano de um oponente neste turno,
 * causa 1.5x o dano recebido.
 * Funciona de forma idêntica ao Metal Burst, mas é do tipo Noturno e faz contato.
 */
export function getComeuppanceDamage(attacker: Pokemon): number {
    // Recupera o dano acumulado neste turno (físico + especial)
    // Os contadores são resetados no final de cada turno (turnEnd.ts).
    const physDamage = attacker.statusEffects['physical-damage-taken']?.damageAccumulated || 0;
    const specDamage = attacker.statusEffects['special-damage-taken']?.damageAccumulated || 0;
    
    const totalDamage = physDamage + specDamage;

    if (totalDamage === 0) return 0;

    return Math.floor(totalDamage * 1.5);
}

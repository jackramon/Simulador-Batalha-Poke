
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Casaco Espelhado (Mirror Coat).
 * Regra Oficial: Se o usuário foi atingido por um ataque ESPECIAL neste turno,
 * causa o dobro (2x) do dano recebido ao oponente.
 * Ignora fraquezas e resistências, mas respeita imunidades de tipo (ex: Noturno).
 */
export function getMirrorCoatDamage(attacker: Pokemon, typeEffectiveness: number): number {
    // Se o alvo for imune (ex: Noturno), o dano é 0.
    if (typeEffectiveness === 0) return 0;

    // Recupera o dano especial acumulado neste turno (registrado em moves.ts)
    const specialDamageTaken = attacker.statusEffects['special-damage-taken']?.damageAccumulated || 0;

    return specialDamageTaken * 2;
}

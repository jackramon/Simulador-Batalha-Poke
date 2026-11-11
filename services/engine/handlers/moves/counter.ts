
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Contra-Ataque (Counter).
 * Regra Oficial: Se o usuário foi atingido por um ataque FÍSICO neste turno,
 * causa o dobro (2x) do dano recebido ao oponente.
 * Ignora fraquezas e resistências, mas respeita imunidades de tipo (ex: Fantasma).
 */
export function getCounterDamage(attacker: Pokemon, typeEffectiveness: number): number {
    // Se o alvo for imune (ex: Fantasma), o dano é 0.
    if (typeEffectiveness === 0) return 0;

    // Recupera o dano físico acumulado neste turno (registrado em moves.ts)
    const physicalDamageTaken = attacker.statusEffects['physical-damage-taken']?.damageAccumulated || 0;

    return physicalDamageTaken * 2;
}

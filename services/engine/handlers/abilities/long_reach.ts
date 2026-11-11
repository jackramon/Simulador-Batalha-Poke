
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Longo Alcance (Long Reach).
 * O Pokémon não faz contato físico ao atacar.
 */
export function isContactSuppressed(attacker: Pokemon): boolean {
    return attacker.ability === 'long-reach';
}

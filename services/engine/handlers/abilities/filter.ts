
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Filtro (Filter), Rocha Sólida (Solid Rock) e Armadura Prisma (Prism Armor).
 * Reduz o dano de ataques super efetivos em 25%.
 */
export function getDamageMultiplier(defender: Pokemon, typeMultiplier: number): number {
    const filterAbilities = ['filter', 'solid-rock', 'prism-armor'];
    
    if (filterAbilities.includes(defender.ability) && typeMultiplier > 1) {
        return 0.75;
    }
    return 1;
}


import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Acrobacia (Acrobatics).
 * Regra Oficial: O poder base dobra (55 -> 110) se o usuário não estiver segurando um item.
 * Nota: Itens consumíveis (como Flying Gem) seriam consumidos antes deste check nos jogos originais,
 * garantindo o boost. No simulador atual, verificamos apenas se heldItem é null.
 */
export function getAcrobaticsPower(attacker: Pokemon, basePower: number): { power: number, isBoosted: boolean } {
    const isBoosted = !attacker.heldItem;
    
    return {
        power: isBoosted ? basePower * 2 : basePower,
        isBoosted
    };
}

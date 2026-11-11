
import { Pokemon } from '../../../../types';

/**
 * Lógica para a habilidade Pó de Escudo (Shield Dust).
 * Regra Oficial: Bloqueia os efeitos secundários de movimentos que causam dano.
 * Exemplos: Chance de status (Burn, Freeze, etc), redução de stats ou recuo (flinch).
 * Esta habilidade É ignorada por Mold Breaker, Teravolt e Turboblaze.
 */
export function blocksSecondaryEffects(defender: Pokemon, ignoresAbilities: boolean): boolean {
    if (defender.isFainted || ignoresAbilities) {
        return false;
    }

    return defender.ability === 'shield-dust';
}


import { Pokemon, Move } from '../../../../types';

/**
 * Lógica para a habilidade À Prova de Fogo (Heatproof).
 * Regras Oficiais:
 * 1. Reduz o dano de ataques do tipo Fogo recebidos pela metade (0.5x).
 * 2. Reduz o dano residual da condição de Queimadura (Burn) pela metade.
 */

export function getFireMoveMultiplier(defender: Pokemon, move: Move, ignoresAbilities: boolean): number {
    if (defender.ability === 'heatproof' && move.type === 'fire' && !ignoresAbilities) {
        return 0.5;
    }
    return 1.0;
}

export function getBurnDamageMultiplier(pokemon: Pokemon): number {
    if (pokemon.ability === 'heatproof') {
        return 0.5;
    }
    return 1.0;
}

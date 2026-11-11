import { Pokemon, BattleState } from '../../../../types';
import * as Terrain from '../terrain';
import * as NeutralizingGas from './neutralizing_gas';

/**
 * Lógica para a habilidade Armadilha de Arena (Arena Trap).
 * Regra Oficial: Impede a troca de oponentes aterrados (grounded).
 * Pokémon do tipo Fantasma são imunes a aprisionamento desde a Gen 6.
 */
export function canTrap(pokemon: Pokemon, opponent: Pokemon, state?: BattleState): boolean {
    if (opponent.ability !== 'arena-trap' || opponent.isFainted) {
        return false;
    }

    // Verifica se a habilidade do oponente está suprimida (ex: Gás Neutralizante)
    if (state && !NeutralizingGas.canAbilityTrigger(opponent, state)) {
        return false;
    }

    // Pokémon do tipo Fantasma são imunes a todos os efeitos de aprisionamento
    if (pokemon.types.includes('ghost')) {
        return false;
    }

    // Arena Trap só afeta Pokémon que estão "aterrados" (grounded)
    // isGrounded já verifica: Tipo Voador, Habilidade Levitate e Item Air Balloon.
    return Terrain.isGrounded(pokemon);
}

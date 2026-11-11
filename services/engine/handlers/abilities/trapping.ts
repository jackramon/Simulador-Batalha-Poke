
import { Pokemon, BattleState } from '../../../../types';
import * as MagnetPull from './magnet_pull';
import * as ShadowTag from './shadow_tag';
import * as ArenaTrap from './arena_trap';
import * as RunAway from './run_away';

/**
 * Verifica se um pokemon está aprisionado por uma habilidade ou efeito do oponente
 */
export function isTrapped(pokemon: Pokemon | null, opponent: Pokemon | null, state?: BattleState): boolean {
    if (!pokemon || pokemon.isFainted) return false;

    // Fugitivo (Run Away): Permite ignorar aprisionamento na Gen 9
    if (RunAway.canBypassTrapping(pokemon, state)) {
        return false;
    }

    // Tipos Fantasma são imunes a todos os efeitos de aprisionamento desde a Gen 6
    if (pokemon.types.includes('ghost')) return false;

    // Aprisionamento por movimentos (Bind, Wrap, Fire Spin, etc.)
    const trappingStatuses = [
        'bind', 'wrap', 'fire-spin', 'whirlpool', 'clamp', 
        'sand-tomb', 'magma-storm', 'infestation', 'snap-trap', 'thunder-cage',
        'cant-escape' // Adicionado para Thousand Waves / Anchor Shot
    ];
    if (trappingStatuses.some(status => !!pokemon.statusEffects[status])) {
        return true;
    }

    if (!opponent || opponent.isFainted) return false;

    // Shadow Tag (Sombra Presa)
    if (ShadowTag.canTrap(pokemon, opponent)) {
        return true;
    }

    // Arena Trap (Armadilha de Arena)
    if (ArenaTrap.canTrap(pokemon, opponent, state)) {
        return true;
    }

    // Magnet Pull (Imã)
    if (MagnetPull.canTrap(pokemon, opponent)) {
        return true;
    }

    return false;
}

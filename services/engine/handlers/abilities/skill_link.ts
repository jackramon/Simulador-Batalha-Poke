
import { Pokemon, Move, BattleState } from '../../../../types';
import * as BeatUp from '../moves/beatUp';

/**
 * Lógica para a habilidade Elo de Habilidade (Skill Link).
 * Garante que movimentos de múltiplos acertos atinjam o número máximo de vezes.
 * Também gerencia contagens dinâmicas de movimentos como Beat Up e Population Bomb.
 */
export function getHitCount(attacker: Pokemon, move: Move, state?: BattleState): number {
    // Lógica específica para Beat Up (Surra)
    if (move.name === 'beat-up' && state) {
        return BeatUp.getHitCount(attacker, state);
    }

    if (!move.minHits || !move.maxHits) {
        return 1;
    }
    
    // Se o Pokémon tem Elo de Habilidade, ele sempre acerta o máximo
    if (attacker.ability === 'skill-link') {
        return move.maxHits;
    }
    
    // Lógica padrão de aleatoriedade (Uniforme entre min e max)
    return Math.floor(Math.random() * (move.maxHits - move.minHits + 1)) + move.minHits;
}

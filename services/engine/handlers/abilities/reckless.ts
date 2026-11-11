
import { Pokemon, Move } from '../../../../types';
import { DAMAGE_RECOIL_MOVES } from '../../../../data/moves';

/**
 * Lógica para a habilidade Imprudente (Reckless).
 * Regra Oficial: Aumenta o poder de movimentos com dano de recuo ou dano de "crash" em 20%.
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability !== 'reckless' || attacker.isFainted) {
        return 1.0;
    }

    // Lista de movimentos de "crash" (voadoras que causam dano ao errar)
    const crashMoves = ['high-jump-kick', 'jump-kick', 'axe-kick'];
    
    // Verifica se o movimento causa recuo baseado no dano causado (DAMAGE_RECOIL_MOVES)
    // ou se é um movimento de crash.
    // Nota: Movimentos que gastam HP fixo (HP_RECOIL_MOVES como Steel Beam) NÃO são afetados.
    const isBoosted = DAMAGE_RECOIL_MOVES[move.name] !== undefined || crashMoves.includes(move.name);

    return isBoosted ? 1.2 : 1.0;
}

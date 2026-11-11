
import { Pokemon, Move } from '../../../../types';

/**
 * Lista de efeitos que NÃO são considerados secundários para fins de Sheer Force.
 * Estes efeitos ocorrem normalmente e não concedem bônus de dano.
 */
const NON_BOOSTED_EFFECTS = [
    'superpower-drop',      // Superpower (Self drop)
    'self-spAttack-down-2', // Overheat, Draco Meteor (Self drop)
    'self-atk-def-down',    // V-create, Close Combat (Self drop)
    'self-faint',           // Explosion, Self-Destruct
    'switch-self',          // U-turn, Volt Switch (Primary mechanic)
    'parting-shot-effect',  // Parting Shot (Status move, but explicitly listed for safety)
    'recoil',               // Recoil damage (Wood Hammer, Flare Blitz)
    'recoil-half',          // Steel Beam
    'knock-off-effect',     // Knock Off (Damage mult logic is primary)
    'screen-break',         // Brick Break, Psychic Fangs
    'future-sight',         // Future Sight (Delayed attack)
    'scale-shot-stats',     // Scale Shot
    'outrage-lock',         // Outrage, Thrash
    'feint',                // Feint (Break protect)
    'break-protect',        // Phantom Force
    'hp-based',             // Flail, Reversal
    'hp-halve',             // Super Fang
    'counter-damage',       // Counter
    'mirror-coat',          // Mirror Coat
    'metal-burst',          // Metal Burst
    'comeuppance',          // Comeuppance
    'memento',              // Memento
    'rapid-spin-effect'     // Correction: Rapid Spin IS boosted in Gen 5+. Keeping it out of this list means it IS boosted.
];

/**
 * Verifica se um movimento é elegível para o bônus de Força Bruta (Sheer Force).
 * Regra: Movimentos com efeitos secundários têm poder aumentado em 30%, mas perdem o efeito.
 */
export function isMoveBoosted(move: Move): boolean {
    // 1. Apenas movimentos de dano
    if (move.damageClass === 'status') return false;

    // 2. Deve ter um efeito definido
    if (!move.effect) return false;

    // 3. O efeito não pode estar na lista de exclusão
    if (NON_BOOSTED_EFFECTS.includes(move.effect.status)) {
        return false;
    }

    return true;
}

/**
 * Retorna o multiplicador de poder da habilidade.
 */
export function getPowerMultiplier(attacker: Pokemon, move: Move): number {
    if (attacker.ability === 'sheer-force' && isMoveBoosted(move)) {
        return 1.3;
    }
    return 1.0;
}

/**
 * Verifica se os efeitos secundários devem ser bloqueados.
 */
export function shouldBlockSecondaryEffects(attacker: Pokemon, move: Move): boolean {
    return attacker.ability === 'sheer-force' && isMoveBoosted(move);
}

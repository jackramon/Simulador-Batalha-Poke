
import { Pokemon, Move, BattleState } from '../../../../types';

/**
 * Lógica para o movimento Empurrão de Braço (Arm Thrust).
 * Movimento físico do tipo Lutador que atinge de 2 a 5 vezes.
 * É classificado como movimento de soco (Boosted by Iron Fist).
 */
export function getArmThrustPower(attacker: Pokemon, basePower: number): number {
    // Arm Thrust é um movimento de múltiplos acertos padrão.
    // A lógica de hits (2-5) e a interação com Skill Link são tratadas pelo motor central (engine/moves.ts).
    // O bônus de Iron Fist é tratado em damageModifiers.ts através da categoria PUNCH_MOVES.
    return basePower;
}

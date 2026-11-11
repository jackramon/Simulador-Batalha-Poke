
import { Pokemon, Move } from '../../../../types';
import { isContactMove } from '../../../battleUtils';

/**
 * Lógica para a habilidade Punho Invisível (Unseen Fist).
 * Regra Oficial: Se o Pokémon usa um movimento de contato, 
 * ele pode atingir o alvo mesmo se este estiver protegido (ex: Protect, Detect).
 */
export function canBypassProtection(attacker: Pokemon, move: Move): boolean {
    if (attacker.ability !== 'unseen-fist' || attacker.isFainted) {
        return false;
    }

    // A habilidade só ativa para movimentos de contato
    return isContactMove(move);
}

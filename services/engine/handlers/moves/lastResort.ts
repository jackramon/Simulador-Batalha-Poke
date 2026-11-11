
import { Pokemon } from '../../../../types';

/**
 * Lógica para o movimento Último Recurso (Last Resort).
 * Regra Oficial: Falha se o usuário não tiver usado todos os seus OUTROS movimentos
 * conhecidos pelo menos uma vez desde que entrou em campo.
 * Também falha se o Último Recurso for o único movimento conhecido.
 */
export function canUseLastResort(attacker: Pokemon): boolean {
    const knownMoves = attacker.moves.map(m => m.name);
    
    // Se só tem Last Resort, falha
    if (knownMoves.length <= 1) {
        return false;
    }

    const otherMoves = knownMoves.filter(m => m !== 'last-resort');
    
    // Verifica se todos os outros movimentos já foram usados
    const allOthersUsed = otherMoves.every(moveName => attacker.movesUsed.includes(moveName));

    return allOthersUsed;
}

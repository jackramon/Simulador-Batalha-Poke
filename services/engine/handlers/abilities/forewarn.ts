import { Pokemon, Move } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para a habilidade Previsão (Forewarn).
 * Regra Oficial: Identifica o movimento com maior poder base do oponente.
 * Escala de Poder Especial:
 * - OHKO Moves (Fissure, Horn Drill, Guillotine, Sheer Cold): 160
 * - Counter, Mirror Coat, Metal Burst: 120
 * - Outros movimentos de dano variável: 80
 * - Status Moves: 0
 */

const OHKO_MOVES = ['fissure', 'horn-drill', 'guillotine', 'sheer-cold'];
const COUNTER_MOVES = ['counter', 'mirror-coat', 'metal-burst'];

export function triggerForewarn(
    pokemon: Pokemon,
    opponent: Pokemon | null,
    logs: { message: string, color: string }[]
): boolean {
    if (pokemon.ability !== 'forewarn' || pokemon.isFainted || !opponent || opponent.isFainted) {
        return false;
    }

    if (!opponent.moves || opponent.moves.length === 0) return false;

    // Calcula o poder efetivo para cada movimento do oponente segundo as regras de Forewarn
    const getEffectivePower = (move: Move): number => {
        if (move.damageClass === 'status') return 0;
        if (OHKO_MOVES.includes(move.name)) return 160;
        if (COUNTER_MOVES.includes(move.name)) return 120;
        if (move.power > 0) return move.power;
        return 80; // Dano variável genérico
    };

    // Ordena os movimentos pelo poder calculado
    const sortedMoves = [...opponent.moves].sort((a, b) => getEffectivePower(b) - getEffectivePower(a));
    const highestPower = getEffectivePower(sortedMoves[0]);

    // Se houver empate, o jogo seleciona um aleatoriamente entre os de maior poder
    const candidates = sortedMoves.filter(m => getEffectivePower(m) === highestPower);
    const chosenMove = candidates[Math.floor(Math.random() * candidates.length)];

    log(logs, `A Previsão de ${pokemon.name} alertou sobre o movimento ${chosenMove.displayName} de ${opponent.name}!`, 'text-indigo-700 font-bold italic');

    return true;
}

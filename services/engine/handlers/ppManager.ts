
import { Pokemon, Move, BattleConfig } from '../../../types';
import * as Pressure from './abilities/pressure';

/**
 * Calcula o custo de PP para um movimento.
 * Considera a habilidade Pressão (Pressure) do defensor.
 */
export function getPPCost(attacker: Pokemon, defender: Pokemon | null, move: Move): number {
    // O custo base é 1
    // A habilidade Pressure aumenta o custo para 2 se o movimento alvejar o Pokémon com a habilidade.
    // Nota: Em uma implementação perfeita, verificaríamos se o movimento realmente alveja o oponente.
    // No contexto atual 1v1, assumimos que a presença do defensor ativo com Pressure afeta o custo.
    return Pressure.getPPCost(defender);
}

/**
 * Deduz o PP do movimento utilizado.
 * Respeita configurações de batalha e casos especiais como Struggle.
 */
export function deductPP(
    attacker: Pokemon, 
    defender: Pokemon | null, 
    move: Move, 
    config: BattleConfig
): void {
    if (!config.moveLimitEnabled) return;

    // Struggle não consome PP (ele é usado quando não há PP)
    if (move.name === 'struggle') return;

    const cost = getPPCost(attacker, defender, move);
    move.uses = Math.max(0, move.uses - cost);
}

/**
 * Verifica se o movimento tem PP suficiente para ser usado.
 */
export function hasSufficientPP(move: Move): boolean {
    // Struggle pode ser usado sem PP
    if (move.name === 'struggle') return true;
    return move.uses > 0;
}


import { Action } from '../../../../types';

/**
 * Lógica para o movimento Perseguição (Pursuit).
 * Regra Oficial: Se o oponente estiver trocando de Pokémon, este movimento 
 * acerta com prioridade (antes da troca) e o poder base dobra (40 -> 80).
 */

/**
 * Calcula o poder da Perseguição baseado na ação do oponente.
 */
export function getPursuitPower(basePower: number, defenderAction?: Action): { power: number, isBoosted: boolean } {
    if (defenderAction && defenderAction.type === 'switch') {
        return { power: basePower * 2, isBoosted: true };
    }
    return { power: basePower, isBoosted: false };
}

/**
 * Verifica se a Perseguição deve interceptar a troca.
 * Se verdadeiro, a engine deve aumentar a prioridade deste movimento para superar a troca (+7).
 */
export function shouldPursuitIntercept(moveName: string, defenderAction?: Action): boolean {
    return moveName === 'pursuit' && defenderAction?.type === 'switch';
}

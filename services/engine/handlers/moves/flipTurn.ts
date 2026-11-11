
import { Pokemon, Move } from '../../../../types';
import { checkSelfSwitch } from './selfSwitch';

/**
 * Lógica para o movimento Virada (Flip Turn).
 * Causa dano e troca o usuário de campo (Pivot).
 * Utiliza a lógica centralizada de checkSelfSwitch.
 */
export function executeFlipTurn(
    attacker: Pokemon, 
    move: Move, 
    team: Pokemon[], 
    logs: {message: string, color: string}[]
): boolean {
    // Executa a verificação padrão de troca própria
    return checkSelfSwitch(attacker, move, team, logs);
}

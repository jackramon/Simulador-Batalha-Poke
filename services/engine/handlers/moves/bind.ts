
import { Pokemon, Move, BattleState } from '../../../../types';
import { applyPartialTrapping } from './partialTrapping';

/**
 * Handler para o movimento Bind (Amarrar).
 * Bind causa dano e prende o alvo por 4-5 turnos.
 * O efeito de aprisionamento causa dano residual de 1/8 do HP máximo ao final de cada turno.
 */
export function handleBind(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    logs: {message: string, color: string}[],
    state?: BattleState
): void {
    // A mecânica principal de Bind é o aprisionamento parcial (Partial Trapping).
    // O dano inicial é calculado pelo sistema de dano padrão.
    // Este handler é chamado pelo roteador de efeitos secundários para aplicar o status 'bind'.
    
    applyPartialTrapping(attacker, defender, move, logs);
}

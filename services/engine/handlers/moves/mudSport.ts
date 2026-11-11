
import { BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Esporte de Lama (Mud Sport).
 * Categoria: Status.
 * Efeito: Cobre o campo com lama, reduzindo o poder dos movimentos do tipo Elétrico
 * em 67% (multiplicador 0.33) por 5 turnos.
 */
export function handleMudSport(
    state: BattleState,
    logs: LogEntry[]
) {
    if (!state) return;

    // Define a duração do efeito para 5 turnos
    state.mudSportTurns = 5;

    log(logs, `Eletricidade foi enfraquecida pelo Esporte de Lama!`, 'text-yellow-700 font-bold italic');
}

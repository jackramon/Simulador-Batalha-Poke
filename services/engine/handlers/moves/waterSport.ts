
import { BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';

/**
 * Lógica para o movimento Esporte de Água (Water Sport).
 * Categoria: Status.
 * Efeito: Cobre o campo com água, reduzindo o poder dos movimentos do tipo Fogo
 * em 67% (multiplicador 0.33) por 5 turnos.
 */
export function handleWaterSport(
    state: BattleState,
    logs: LogEntry[]
) {
    if (!state) return;

    // Define a duração do efeito para 5 turnos
    state.waterSportTurns = 5;

    log(logs, `Fogo foi enfraquecido pelo Esporte de Água!`, 'text-blue-500 font-bold italic');
}

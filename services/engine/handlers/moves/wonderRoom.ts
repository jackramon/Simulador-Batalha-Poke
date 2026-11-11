
import { BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

/**
 * Lógica para o movimento Sala Maravilhosa (Wonder Room).
 * Efeito:
 * 1. Troca a Defesa e a Defesa Especial de todos os Pokémon em campo por 5 turnos.
 * 2. Se usado enquanto já estiver ativo, o efeito termina imediatamente.
 */
export function handleWonderRoom(
    state: BattleState, 
    logs: LogEntry[]
) {
    if (state.wonderRoomActive) {
        state.wonderRoomActive = false;
        state.wonderRoomTurns = 0;
        log(logs, BATTLE_MESSAGES.WONDER_ROOM_END(), 'text-purple-700 font-bold italic');
    } else {
        state.wonderRoomActive = true;
        state.wonderRoomTurns = 5;
        log(logs, BATTLE_MESSAGES.WONDER_ROOM_START(), 'text-purple-700 font-bold italic');
    }
}

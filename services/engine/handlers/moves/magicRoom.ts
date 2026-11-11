
import { BattleState, LogEntry } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';

export function handleMagicRoom(state: BattleState, logs: LogEntry[]) {
    if (state.magicRoomActive) {
        state.magicRoomActive = false;
        state.magicRoomTurns = 0;
        log(logs, BATTLE_MESSAGES.MAGIC_ROOM_END(), 'text-purple-700 font-bold italic');
    } else {
        state.magicRoomActive = true;
        state.magicRoomTurns = 5;
        log(logs, BATTLE_MESSAGES.MAGIC_ROOM_START(), 'text-purple-700 font-bold italic');
    }
}

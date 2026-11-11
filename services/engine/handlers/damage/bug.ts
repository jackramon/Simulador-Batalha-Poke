
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as FuryCutter from '../moves/furyCutter';
import * as Steamroller from '../moves/steamroller';

export function getBugMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'fury-cutter':
            return FuryCutter.getFuryCutterPower(attacker, basePower);
        case 'steamroller': {
            const res = Steamroller.getSteamrollerPower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, `Rolo Compressor esmagou o alvo minimizado!`, 'text-red-700 font-black italic');
            }
            return res.power;
        }
        default:
            return basePower;
    }
}

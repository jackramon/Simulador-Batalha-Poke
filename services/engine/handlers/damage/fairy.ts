
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as MistyExplosion from '../moves/mistyExplosion';
import * as StrangeSteam from '../moves/strangeSteam';
import * as FairyWind from '../moves/fairyWind';

export function getFairyMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'misty-explosion': {
            const res = MistyExplosion.getMistyExplosionPower(attacker, basePower, state);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, `O poder explodiu devido à Névoa!`, 'text-pink-600 font-bold italic');
            }
            return res.power;
        }
        case 'strange-steam':
            return StrangeSteam.handleStrangeSteamDamage(attacker, defender, move, state);
        case 'fairy-wind':
            return FairyWind.getFairyWindPower(attacker, basePower, state);
        default:
            return basePower;
    }
}

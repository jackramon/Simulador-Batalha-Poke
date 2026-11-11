
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as WeightBased from '../moves/weightBased';
import * as SpeedBased from '../moves/speedBased';
import * as HardPress from '../moves/hardPress';
import * as GearGrind from '../moves/gearGrind';

export function getSteelMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'heavy-slam': {
            basePower = WeightBased.calculateWeightPower(move.name, attacker, defender);
            if (hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.WEIGHT_POWER(move.displayName, basePower), 'text-gray-500 text-xs italic');
            }
            return basePower;
        }
        case 'gyro-ball': {
            const weather = state?.weather || 'none';
            basePower = SpeedBased.calculateGyroBallPower(attacker, defender, weather);
            if (hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.SPEED_BASED_POWER(move.displayName, basePower), 'text-gray-500 text-xs italic');
            }
            return basePower;
        }
        case 'hard-press': {
            basePower = HardPress.getHardPressPower(defender);
            if (hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.HP_BASED_POWER(move.displayName, `${basePower}`), 'text-gray-500 text-xs italic');
            }
            return basePower;
        }
        case 'gear-grind': {
            return GearGrind.getGearGrindPower(attacker, basePower);
        }
        default:
            return basePower;
    }
}

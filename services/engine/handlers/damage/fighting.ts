
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as WeightBased from '../moves/weightBased';
import * as HpBased from '../moves/hpBased';
import * as WakeUpSlap from '../moves/wakeUpSlap';
import * as Revenge from '../moves/revenge';
import * as ArmThrust from '../moves/armThrust';
import * as FlyingPress from '../moves/flyingPress';
import * as VitalThrow from '../moves/vitalThrow';
import * as TripleKick from '../moves/tripleKick';
import * as DoubleKick from '../moves/doubleKick';
import * as BodyPress from '../moves/bodyPress';
import * as StormThrow from '../moves/stormThrow';

export function getFightingMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'low-kick': {
            basePower = WeightBased.calculateWeightPower(move.name, attacker, defender);
            if (hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.WEIGHT_POWER(move.displayName, basePower), 'text-gray-500 text-xs italic');
            }
            return basePower;
        }
        case 'reversal': {
            const res = HpBased.getHpBasedPower(attacker);
            if (hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.HP_BASED_POWER(move.displayName, res.intensity), 'text-orange-600 text-xs italic font-bold');
            }
            return res.power;
        }
        case 'wake-up-slap': {
            const res = WakeUpSlap.getWakeUpSlapPower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.WAKE_UP_SLAP_BOOST(), 'text-orange-600 text-xs italic font-bold');
            }
            return res.power;
        }
        case 'revenge': {
            const res = Revenge.getRevengePower(attacker, defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.REVENGE_BOOST(), 'text-red-700 font-bold italic');
            }
            return res.power;
        }
        case 'arm-thrust':
            return ArmThrust.getArmThrustPower(attacker, basePower);
        case 'double-kick':
            return DoubleKick.getDoubleKickPower(attacker, basePower);
        case 'flying-press': {
            const power = FlyingPress.getPower(defender, basePower);
            if (power > basePower && hitIndex === 0) {
                log(logs, `Prensa Voadora esmagou o alvo minimizado!`, 'text-red-700 font-black italic');
            }
            return power;
        }
        case 'vital-throw':
            return VitalThrow.handleVitalThrow(attacker, defender, move, state);
        case 'triple-kick':
            return TripleKick.getTripleKickPower(basePower, hitIndex);
        case 'body-press':
            return BodyPress.handleBodyPress(attacker, defender, move, state);
        case 'storm-throw':
            return StormThrow.getStormThrowPower(attacker, defender, move, state);
        default:
            return basePower;
    }
}

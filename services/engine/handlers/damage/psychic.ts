
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as ExpandingForce from '../moves/expandingForce';
import * as StoredPower from '../moves/storedPower';
import * as PrismaticLaser from '../moves/prismaticLaser';
import * as Psyblade from '../moves/psyblade';

export function getPsychicMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'psyblade': {
            return Psyblade.getPsybladePower(attacker, basePower, state, logs);
        }
        case 'expanding-force': {
            const res = ExpandingForce.getExpandingForcePower(attacker, state, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.EXPANDING_FORCE_BOOST(), 'text-purple-600 text-xs italic font-bold');
            }
            return res.power;
        }
        case 'stored-power': {
            const res = StoredPower.getStoredPowerPower(attacker, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.STORED_POWER_BOOST(res.stageSum), 'text-purple-600 font-black italic');
            }
            return res.power;
        }
        case 'prismatic-laser':
            return PrismaticLaser.handlePrismaticLaser(attacker, defender, move, state);
        default:
            return basePower;
    }
}

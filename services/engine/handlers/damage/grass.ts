
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as WeightBased from '../moves/weightBased';
import * as GrassPledge from '../moves/grassPledge';
import * as Absorb from '../moves/absorb';
import * as FrenzyPlant from '../moves/frenzyPlant';
import * as SolarBeam from '../moves/solarBeam';

export function getGrassMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'solar-beam':
            return SolarBeam.getSolarBeamPower(attacker, defender, move, state, hitIndex, logs);
        case 'absorb':
            return Absorb.handleAbsorb(attacker, defender, move, state);
        case 'frenzy-plant':
            return FrenzyPlant.handleFrenzyPlant(attacker, defender, move, state);
        case 'grass-knot': {
            basePower = WeightBased.calculateWeightPower(move.name, attacker, defender);
            if (hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.WEIGHT_POWER(move.displayName, basePower), 'text-gray-500 text-xs italic');
            }
            return basePower;
        }
        case 'grass-pledge': {
            // Voto de Grama (Grass Pledge)
            return GrassPledge.getGrassPledgePower(attacker, basePower);
        }
        default:
            return basePower;
    }
}


import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as SpeedBased from '../moves/speedBased';
import * as RisingVoltage from '../moves/risingVoltage';
import * as FusionBolt from '../moves/fusionBolt';
import * as Overdrive from '../moves/overdrive';
import * as Thunder from '../moves/thunder';

export function getElectricMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    // Redução por Esporte de Lama (Mud Sport)
    // Regra Oficial (Gen 5+): Reduz o poder em 67% (x0.33)
    if (state && state.mudSportTurns > 0) {
        basePower = Math.floor(basePower * 0.33);
        if (hitIndex === 0) {
            log(logs, `O poder do golpe foi enfraquecido pela lama!`, 'text-yellow-700 italic text-xs');
        }
    }

    switch (move.name) {
        case 'thunder':
            return Thunder.handleThunder(attacker, defender, move, state);
        case 'electro-ball': {
            const weather = state?.weather || 'none';
            basePower = SpeedBased.calculateElectroBallPower(attacker, defender, weather);
            // Aplica redução do Mud Sport também ao poder calculado dinamicamente
            if (state && state.mudSportTurns > 0) {
                 basePower = Math.floor(basePower * 0.33);
            }
            if (hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.SPEED_BASED_POWER(move.displayName, basePower), 'text-gray-500 text-xs italic');
            }
            return basePower;
        }
        case 'rising-voltage': {
            const res = RisingVoltage.getRisingVoltagePower(defender, state, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.RISING_VOLTAGE_BOOST(), 'text-yellow-600 font-bold italic');
            }
            return res.power;
        }
        case 'fusion-bolt': {
            const res = FusionBolt.getFusionBoltPower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.FUSION_BOLT_BOOST(), 'text-blue-600 font-black italic');
            }
            return res.power;
        }
        case 'overdrive':
            return Overdrive.handleOverdrive(attacker, defender, move, state);
        default:
            return basePower;
    }
}

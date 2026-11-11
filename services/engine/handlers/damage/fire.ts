
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as WeightBased from '../moves/weightBased';
import * as TemperFlare from '../moves/temperFlare';
import * as FirePledge from '../moves/firePledge';
import * as FusionFlare from '../moves/fusionFlare';
import * as Eruption from '../moves/eruption';
import * as BlastBurn from '../moves/blastBurn';

export function getFireMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    // Redução por Esporte de Água (Water Sport)
    // Regra Oficial (Gen 5+): Reduz o poder em 67% (x0.33)
    if (state && state.waterSportTurns > 0) {
        basePower = Math.floor(basePower * 0.33);
        if (hitIndex === 0) {
            log(logs, `O poder do golpe foi enfraquecido pela água!`, 'text-blue-600 italic text-xs');
        }
    }

    switch (move.name) {
        case 'blast-burn':
            return BlastBurn.handleBlastBurn(attacker, defender, move, state);
        case 'heat-crash': {
            basePower = WeightBased.calculateWeightPower(move.name, attacker, defender);
            if (hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.WEIGHT_POWER(move.displayName, basePower), 'text-gray-500 text-xs italic');
            }
            return basePower;
        }
        case 'temper-flare': {
            const res = TemperFlare.getTemperFlarePower(attacker, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.TEMPER_FLARE_BOOST(), 'text-red-600 font-bold italic');
            }
            return res.power;
        }
        case 'fire-pledge': {
            return FirePledge.getFirePledgePower(attacker, basePower);
        }
        case 'fusion-flare': {
            const res = FusionFlare.getFusionFlarePower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.FUSION_FLARE_BOOST(), 'text-orange-600 font-black italic');
            }
            return res.power;
        }
        case 'eruption': {
            const power = Eruption.getEruptionPower(attacker);
            if (hitIndex === 0 && attacker.hp < attacker.maxHP) {
                log(logs, `A Erupção está mais fraca devido ao HP reduzido!`, 'text-gray-500 text-xs italic');
            }
            return power;
        }
        default:
            return basePower;
    }
}


import { Pokemon, Move, BattleState, Action } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Assurance from '../moves/assurance';
import * as KnockOff from '../moves/knockOff';
import * as LashOut from '../moves/lashOut';
import * as Pursuit from '../moves/pursuit';
import * as PowerTrip from '../moves/powerTrip';
import * as Comeuppance from '../moves/comeuppance';
import * as FeintAttack from '../moves/feintAttack';
import * as Fling from '../moves/fling';
import * as BeatUp from '../moves/beatUp';
import * as DarkestLariat from '../moves/darkestLariat';
import * as Punishment from '../moves/punishment';
import * as Payback from '../moves/payback';

export function getDarkMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[],
    defenderAction?: Action
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'punishment': {
            return Punishment.getPunishmentPower(defender, basePower, logs);
        }
        case 'beat-up': {
            return BeatUp.getBasePower(attacker, state, hitIndex);
        }
        case 'fling': {
            // Fling calcula o poder dinamicamente baseado no item.
            // A lógica de preMoveValidation já deve ter setado o poder no objeto 'move'
            // mas como garantia e consistência, podemos recalcular aqui se necessário.
            // Se o item já foi consumido, usamos o valor que foi setado em preMoveValidation (que modificou a instância de move passada)
            // Se move.power já foi atualizado, usamos ele.
            return move.power;
        }
        case 'assurance': {
            const res = Assurance.getAssurancePower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.ASSURANCE_BOOST(), 'text-indigo-600 text-xs italic');
            }
            return res.power;
        }
        case 'knock-off': {
            const newPower = KnockOff.getKnockOffPower(defender, basePower, state);
            if (newPower > basePower && hitIndex === 0) {
                log(logs, 'Dano aumentado por derrubar o item!', 'text-purple-600 text-xs italic');
            }
            return newPower;
        }
        case 'lash-out': {
            const res = LashOut.getLashOutPower(attacker, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.LASH_OUT_BOOST(), 'text-purple-800 font-bold italic');
            }
            return res.power;
        }
        case 'pursuit': {
            const res = Pursuit.getPursuitPower(basePower, defenderAction);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.PURSUIT_BOOST(), 'text-purple-700 font-black italic');
            }
            return res.power;
        }
        case 'power-trip': {
            const res = PowerTrip.getPowerTripPower(attacker, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.POWER_TRIP_BOOST(res.stageSum), 'text-purple-800 font-black italic');
            }
            return res.power;
        }
        case 'comeuppance': {
            return Comeuppance.getComeuppanceDamage(attacker);
        }
        case 'feint-attack': {
            return FeintAttack.handleFeintAttack(attacker, defender, move, state);
        }
        case 'darkest-lariat': {
            return DarkestLariat.handleDarkestLariat(attacker, defender, move, state);
        }
        case 'payback': {
            const res = Payback.getPaybackPower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.PAYBACK_BOOST(), 'text-purple-800 font-bold italic');
            }
            return res.power;
        }
        default:
            return basePower;
    }
}

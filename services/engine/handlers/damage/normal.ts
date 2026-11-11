
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as Facade from '../moves/facade';
import * as EchoedVoice from '../moves/echoedVoice';
import * as WeatherBall from '../moves/weatherBall';
import * as Retaliate from '../moves/retaliate';
import * as Stomp from '../moves/stomp';
import * as HpBased from '../moves/hpBased';
import * as SmellingSalts from '../moves/smellingSalts';
import * as HornAttack from '../moves/hornAttack';
import * as WringOut from '../moves/wringOut';
import * as QuickAttack from '../moves/quickAttack';
import * as SpitUp from '../moves/spitUp';
import * as DoubleEdge from '../moves/doubleEdge';
import * as HyperBeam from '../moves/hyperBeam';
import * as HyperVoice from '../moves/hyperVoice';
import * as Boomburst from '../moves/boomburst';
import * as MegaKick from '../moves/megaKick';
import * as Frustration from '../moves/frustration';
import * as EggBomb from '../moves/eggBomb';

import * as TrumpCard from '../moves/trumpCard';

export function getNormalMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'trump-card':
            return TrumpCard.getTrumpCardPower(move);
        case 'facade': {
            const res = Facade.getFacadePower(attacker, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.FACADE_BOOST(), 'text-indigo-600 text-xs italic');
            }
            return res.power;
        }
        case 'echoed-voice':
            return EchoedVoice.getEchoedVoicePower(attacker, basePower);
        case 'weather-ball': {
            const weather = state?.weather || 'none';
            basePower = WeatherBall.getPower(basePower, weather);
            if (hitIndex === 0 && weather !== 'none') {
                log(logs, `A Bola Climática mudou de tipo e dobrou de força!`, 'text-indigo-600 font-bold italic');
            }
            return basePower;
        }
        case 'retaliate': {
            const originalPower = basePower;
            basePower = Retaliate.getRetaliatePower(attacker, basePower, state);
            if (basePower > originalPower && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.RETALIATE_BOOST(), 'text-red-600 font-bold italic');
            }
            return basePower;
        }
        case 'stomp': {
            const res = Stomp.getStompPower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, `Pisão causou dano devastador no alvo minimizado!`, 'text-red-700 font-black italic');
            }
            return res.power;
        }
        case 'flail': {
            const res = HpBased.getHpBasedPower(attacker);
            if (hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.HP_BASED_POWER(move.displayName, res.intensity), 'text-orange-600 text-xs italic font-bold');
            }
            return res.power;
        }
        case 'smelling-salts': {
            const res = SmellingSalts.getSmellingSaltsPower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, "O choque curativo dobrou o poder do ataque!", 'text-indigo-600 font-bold italic');
            }
            return res.power;
        }
        case 'horn-attack':
            return HornAttack.handleHornAttack(attacker, defender, move, state);
        case 'quick-attack':
            return QuickAttack.handleQuickAttack(attacker, defender, move, state);
        case 'double-edge':
            return DoubleEdge.handleDoubleEdge(attacker, defender, move, state);
        case 'hyper-beam':
            return HyperBeam.handleHyperBeam(attacker, defender, move, state);
        case 'hyper-voice':
            return HyperVoice.handleHyperVoice(attacker, defender, move, state);
        case 'boomburst':
            return Boomburst.handleBoomburst(attacker, defender, move, state);
        case 'mega-kick':
            return MegaKick.handleMegaKick(attacker, defender, move, state);
        case 'egg-bomb':
            return EggBomb.handleEggBomb(attacker, defender, move, state);
        case 'frustration':
            return Frustration.getFrustrationPower(attacker);
        case 'wring-out':
        case 'crush-grip': {
            basePower = WringOut.getWringOutPower(defender);
            if (hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.HP_BASED_POWER(move.displayName, `${basePower}`), 'text-gray-500 text-xs italic');
            }
            return basePower;
        }
        case 'spit-up': {
            const power = SpitUp.getSpitUpPower(attacker);
            if (hitIndex === 0) {
                log(logs, `Liberando ${power/100} estoques de energia!`, 'text-orange-600 font-bold text-xs');
            }
            return power;
        }
        default:
            return basePower;
    }
}

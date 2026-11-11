
import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as StompingTantrum from '../moves/stompingTantrum';
import * as Bonemerang from '../moves/bonemerang';
import * as Earthquake from '../moves/earthquake';
import * as Magnitude from '../moves/magnitude';

export function getGroundMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'magnitude': {
            // Magnitude calcula seu próprio poder base aleatório
            basePower = Magnitude.getMagnitudePower(attacker, logs);
            // Aplica boost de Earthquake se o alvo estiver enterrado (Dig)
            return Earthquake.getEarthquakePower(defender, basePower);
        }
        case 'stomping-tantrum': {
            const res = StompingTantrum.getStompingTantrumPower(attacker, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, BATTLE_MESSAGES.TANTRUM_BOOST(), 'text-orange-700 font-bold italic');
            }
            return res.power;
        }
        case 'bonemerang': {
            return Bonemerang.handleBonemerang(attacker, defender, move, state);
        }
        case 'earthquake': {
            const newPower = Earthquake.getEarthquakePower(defender, basePower);
            if (newPower > basePower && hitIndex === 0) {
                log(logs, `O tremor atingiu ${defender.name} no subsolo com força dobrada!`, 'text-red-700 font-bold italic');
            }
            return newPower;
        }
        default:
            return basePower;
    }
}


import { Pokemon, Move, BattleState } from '../../../../types';
import { log } from '../../utils';
import * as Twister from '../moves/twister';
import * as DynamaxCannon from '../moves/dynamaxCannon';
import * as DragonEnergy from '../moves/dragonEnergy';
import * as DragonHammer from '../moves/dragonHammer';

export function getDragonMovePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[]
): number {
    let basePower = move.power;

    switch (move.name) {
        case 'twister':
            return Twister.getTwisterPower(defender, basePower);
        case 'dynamax-cannon': {
            const res = DynamaxCannon.getDynamaxCannonPower(defender, basePower);
            if (res.isBoosted && hitIndex === 0) {
                log(logs, 'O Canhão Dynamax causou dano massivo no alvo gigante!', 'text-purple-600 font-black italic');
            }
            return res.power;
        }
        case 'dragon-energy': {
            const power = DragonEnergy.getDragonEnergyPower(attacker);
            if (hitIndex === 0 && attacker.hp < attacker.maxHP) {
                log(logs, `A Energia Dracônica enfraqueceu devido à exaustão!`, 'text-gray-500 text-xs italic');
            }
            return power;
        }
        case 'dragon-hammer':
            return DragonHammer.handleDragonHammer(attacker, defender, move, state);
        default:
            return basePower;
    }
}

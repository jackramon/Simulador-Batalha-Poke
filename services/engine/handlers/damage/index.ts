
import { Pokemon, Move, BattleState, Action } from '../../../../types';
import { log } from '../../utils';
import { BATTLE_MESSAGES } from '../../../../data/battleMessages';
import * as TerrainPulse from '../moves/terrainPulse';
import * as Normal from './normal';
import * as Fire from './fire';
import * as Water from './water';
import * as Grass from './grass';
import * as Electric from './electric';
import * as Ice from './ice';
import * as Fighting from './fighting';
import * as Poison from './poison';
import * as Ground from './ground';
import * as Flying from './flying';
import * as Psychic from './psychic';
import * as Bug from './bug';
import * as Rock from './rock';
import * as Ghost from './ghost';
import * as Dragon from './dragon';
import * as Steel from './steel';
import * as Dark from './dark';
import * as Fairy from './fairy';

const typeHandlers: Record<string, any> = {
    'normal': Normal.getNormalMovePower,
    'fire': Fire.getFireMovePower,
    'water': Water.getWaterMovePower,
    'grass': Grass.getGrassMovePower,
    'electric': Electric.getElectricMovePower,
    'ice': Ice.getIceMovePower,
    'fighting': Fighting.getFightingMovePower,
    'poison': Poison.getPoisonMovePower,
    'ground': Ground.getGroundMovePower,
    'flying': Flying.getFlyingMovePower,
    'psychic': Psychic.getPsychicMovePower,
    'bug': Bug.getBugMovePower,
    'rock': Rock.getRockMovePower,
    'ghost': Ghost.getGhostMovePower,
    'dragon': Dragon.getDragonMovePower,
    'steel': Steel.getSteelMovePower,
    'dark': Dark.getDarkMovePower,
    'fairy': Fairy.getFairyMovePower,
};

export function calculateBasePower(
    attacker: Pokemon,
    defender: Pokemon,
    move: Move,
    effectiveMoveType: string,
    state: BattleState | undefined,
    hitIndex: number,
    logs: {message: string, color: string}[],
    defenderAction?: Action
): number {
    if (move.name === 'terrain-pulse') {
        const terrain = state?.terrain || 'none';
        const res = TerrainPulse.getTerrainPulsePower(attacker, move.power, terrain);
        if (res.isBoosted && hitIndex === 0) {
            log(logs, BATTLE_MESSAGES.TERRAIN_PULSE_BOOST(), 'text-purple-600 font-bold italic');
        }
        return res.power;
    }

    const handler = typeHandlers[move.type];

    if (handler) {
        return handler(attacker, defender, move, state, hitIndex, logs, defenderAction);
    }

    return move.power;
}

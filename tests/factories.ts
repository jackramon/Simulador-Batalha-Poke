import { Pokemon, BattleState } from '../types';

export const createDummy = (overrides: Partial<Pokemon> = {}): Pokemon => ({
    id: 1, name: 'Tester', hp: 100, maxHP: 100, ability: 'synchronize', types: ['normal'],
    moves: [], movesUsed: [], statusEffects: {}, statStages: {accuracy:0,evasion:0,attack:0,defense:0,spAttack:0,spDefense:0,speed:0},
    spriteUrl:'', backSpriteUrl:'', pixelSpriteUrl:'', fallbackUrls:[], attackStat:100, defenseStat:100, spAttackStat:100, spDefenseStat:100, speedStat:100, weight:100, heldItem:null, hadItem:false, lockedMove:null, turnsActive:0, chargingMove:null, mustRecharge:false, isFainted:false, isFlinched:false, gender:'genderless', ...overrides
} as Pokemon);

export const createBattleState = (team1: Pokemon[], team2: Pokemon[], overrides: Partial<BattleState> = {}): BattleState => {
    const currentPokemon1 = team1[0];
    const currentPokemon2 = team2[0];
    
    return {
        team1,
        team2,
        currentPokemon1,
        currentPokemon2,
        p1Hazards: { mist: 0, safeguard: 0, stealthRock: false, spikes: 0, toxicSpikes: 0, stickyWeb: false, lightScreen: 0, reflect: 0, auroraVeil: 0, tailwind: 0 },
        p2Hazards: { mist: 0, safeguard: 0, stealthRock: false, spikes: 0, toxicSpikes: 0, stickyWeb: false, lightScreen: 0, reflect: 0, auroraVeil: 0, tailwind: 0 },
        weather: 'none',
        weatherTurns: 0,
        terrain: 'none',
        terrainTurns: 0,
        trickRoomTurns: 0,
        magicRoomTurns: 0,
        wonderRoomTurns: 0,
        gravityTurns: 0,
        turn: 1,
        ...overrides
    } as unknown as BattleState;
};

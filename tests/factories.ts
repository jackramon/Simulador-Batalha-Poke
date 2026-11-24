import { Move, Pokemon, BattleState, BagItem, PlayerInventory, SideHazards, StatStages, StatusEffect } from '../types';

export const createMove = (overrides: Partial<Move> = {}): Move => ({
    name: 'tackle',
    displayName: 'Tackle',
    power: 40,
    type: 'normal',
    accuracy: 100,
    isStatus: false,
    damageClass: 'physical',
    description: 'Golpe físico determinístico para testes.',
    uses: 35,
    maxUses: 35,
    ...overrides,
    effect: overrides.effect ? { ...overrides.effect } : undefined,
});

const cloneMove = (move: Move): Move => ({
    ...move,
    effect: move.effect ? { ...move.effect } : undefined,
});

const cloneStatusEffects = (effects: Record<string, StatusEffect>): Record<string, StatusEffect> =>
    Object.fromEntries(Object.entries(effects).map(([key, effect]) => [key, { ...effect }]));

export const createStatStages = (overrides: Partial<StatStages> = {}): StatStages => ({
    accuracy: 0, evasion: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0,
    ...overrides,
});

export const createSideHazards = (overrides: Partial<SideHazards> = {}): SideHazards => ({
    toxicSpikes: 0, reflect: 0, lightScreen: 0, safeguard: 0, mist: 0, luckyChant: 0, auroraVeil: 0,
    stealthRock: false, stickyWeb: false, spikes: 0, tailwind: 0,
    ...overrides,
});

export const createBagItem = (overrides: Partial<BagItem> = {}): BagItem => ({
    id: 'potion', quantity: 1,
    ...overrides,
});

export const createPlayerInventory = (overrides: Partial<PlayerInventory> = {}): PlayerInventory => ({
    ...overrides,
    items: [...(overrides.items ?? [])].map(item => ({ ...item })),
});

export const createPokemon = (overrides: Partial<Pokemon> = {}): Pokemon => {
    const base: Pokemon = {
        id: 1, name: 'Tester', hp: 100, maxHP: 100, ability: 'synchronize', types: ['normal'],
        moves: [], movesUsed: [], statusEffects: {}, statStages: createStatStages(),
        spriteUrl: '', backSpriteUrl: '', pixelSpriteUrl: '', fallbackUrls: [], attackStat: 100, defenseStat: 100,
        spAttackStat: 100, spDefenseStat: 100, speedStat: 100, weight: 100, heldItem: null, hadItem: false,
        lockedMove: null, turnsActive: 0, chargingMove: null, mustRecharge: false, isFainted: false, isFlinched: false,
        gender: 'genderless',
    };

    return {
        ...base,
        ...overrides,
        types: [...(overrides.types ?? base.types)],
        fallbackUrls: [...(overrides.fallbackUrls ?? base.fallbackUrls)],
        moves: (overrides.moves ?? base.moves).map(cloneMove),
        movesUsed: [...(overrides.movesUsed ?? base.movesUsed)],
        statusEffects: cloneStatusEffects(overrides.statusEffects ?? base.statusEffects),
        statStages: createStatStages(overrides.statStages ?? base.statStages),
        possibleAbilities: overrides.possibleAbilities ? [...overrides.possibleAbilities] : undefined,
        disabledMoves: overrides.disabledMoves ? { ...overrides.disabledMoves } : undefined,
        movePool: overrides.movePool ? overrides.movePool.map(cloneMove) : undefined,
        lastMoveUsed: overrides.lastMoveUsed ? cloneMove(overrides.lastMoveUsed) : overrides.lastMoveUsed,
        selectedMove: overrides.selectedMove ? cloneMove(overrides.selectedMove) : overrides.selectedMove,
        ivs: overrides.ivs ? { ...overrides.ivs } : undefined,
        evs: overrides.evs ? { ...overrides.evs } : undefined,
        cries: overrides.cries ? { ...overrides.cries } : undefined,
        megaProfile: overrides.megaProfile ? {
            ...overrides.megaProfile,
            stats: { ...overrides.megaProfile.stats },
            types: [...overrides.megaProfile.types],
        } : undefined,
        illusionData: overrides.illusionData ? { ...overrides.illusionData } : undefined,
    };
};

// Alias mantido para os testes já existentes; novas fixtures devem usar createPokemon.
export const createDummy = createPokemon;

export const createBattleState = (
    team1: Pokemon[] = [createPokemon({ id: 1, name: 'Player 1' })],
    team2: Pokemon[] = [createPokemon({ id: 2, name: 'Player 2' })],
    overrides: Partial<BattleState> = {},
): BattleState => {
    const resolvedTeam1 = [...(overrides.team1 ?? team1)];
    const resolvedTeam2 = [...(overrides.team2 ?? team2)];
    const currentPokemon1 = overrides.currentPokemon1 === undefined ? resolvedTeam1[0] ?? null : overrides.currentPokemon1;
    const currentPokemon2 = overrides.currentPokemon2 === undefined ? resolvedTeam2[0] ?? null : overrides.currentPokemon2;

    const base: BattleState = {
        team1: resolvedTeam1,
        team2: resolvedTeam2,
        currentPokemon1,
        currentPokemon2,
        p1Inventory: createPlayerInventory(),
        p2Inventory: createPlayerInventory(),
        turn: 1,
        weather: 'none',
        weatherTurns: 0,
        terrain: 'none',
        terrainTurns: 0,
        gravity: false,
        gravityTurns: 0,
        mudSportTurns: 0,
        waterSportTurns: 0,
        ionDelugeActive: false,
        wonderRoomActive: false,
        wonderRoomTurns: 0,
        magicRoomActive: false,
        magicRoomTurns: 0,
        trickRoomActive: false,
        trickRoomTurns: 0,
        p1Hazards: createSideHazards(),
        p2Hazards: createSideHazards(),
        logs: [],
        isBattleInProgress: true,
        winner: null,
        waitingForAction: false,
    };

    return {
        ...base,
        ...overrides,
        team1: resolvedTeam1,
        team2: resolvedTeam2,
        currentPokemon1,
        currentPokemon2,
        p1Hazards: createSideHazards(overrides.p1Hazards),
        p2Hazards: createSideHazards(overrides.p2Hazards),
        p1Inventory: createPlayerInventory(overrides.p1Inventory),
        p2Inventory: createPlayerInventory(overrides.p2Inventory),
        logs: [...(overrides.logs ?? [])].map(log => ({ ...log })),
    };
};

import { afterEach, describe, expect, it, vi } from 'vitest';
import { BattleState, LogEntry, Pokemon } from '../types';
import { createBagItem, createBattleState, createDummy, createMove, createPlayerInventory, createPokemon, createSideHazards } from './factories';

describe('fixtures locais de batalha', () => {
  describe('createMove', () => {
    it('cria um golpe com padrões válidos e determinísticos', () => {
      expect(createMove()).toEqual({
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
      });
      expect(createMove()).toEqual(createMove());
    });

    it('aplica overrides explícitos', () => {
      const move = createMove({
        name: 'ember',
        displayName: 'Brasa',
        power: 90,
        type: 'fire',
        damageClass: 'special',
        effect: { status: 'burn', chance: 10 },
      });

      expect(move).toMatchObject({
        name: 'ember',
        displayName: 'Brasa',
        power: 90,
        type: 'fire',
        damageClass: 'special',
        accuracy: 100,
        uses: 35,
        effect: { status: 'burn', chance: 10 },
      });
    });

    it('independiza instâncias e efeitos recebidos pelo mesmo override', () => {
      const overrides = { effect: { status: 'burn', chance: 10 } };
      const first = createMove(overrides);
      const second = createMove(overrides);

      expect(first).not.toBe(second);
      expect(first.effect).not.toBe(second.effect);

      first.effect!.chance = 90;

      expect(second.effect!.chance).toBe(10);
    });
  });

  describe('createPokemon', () => {
    it('cria um Pokémon com padrões válidos e determinísticos', () => {
      const pokemon = createPokemon();

      expect(pokemon).toMatchObject({
        id: 1,
        name: 'Tester',
        hp: 100,
        maxHP: 100,
        ability: 'synchronize',
        heldItem: null,
        gender: 'genderless',
        isFainted: false,
        turnsActive: 0,
      });
      expect(pokemon.types).toEqual(['normal']);
      expect(pokemon.moves).toEqual([]);
      expect(pokemon.movesUsed).toEqual([]);
      expect(pokemon.fallbackUrls).toEqual([]);
      expect(pokemon.statusEffects).toEqual({});
      expect(pokemon.statStages).toEqual({
        accuracy: 0,
        evasion: 0,
        attack: 0,
        defense: 0,
        spAttack: 0,
        spDefense: 0,
        speed: 0,
      });
      expect(createPokemon()).toEqual(createPokemon());
    });

    it('aplica overrides explícitos', () => {
      const move = createMove({ name: 'thunderbolt', type: 'electric', damageClass: 'special' });
      const pokemon = createPokemon({
        name: 'Pikachu',
        ability: 'static',
        hp: 50,
        maxHP: 80,
        types: ['electric'],
        moves: [move],
        movesUsed: ['tackle'],
        statusEffects: { burn: { turns: 2 } },
        statStages: {
          accuracy: 0,
          evasion: 0,
          attack: 2,
          defense: 0,
          spAttack: 0,
          spDefense: 0,
          speed: 1,
        },
        heldItem: 'light-ball',
        gender: 'female',
      });

      expect(pokemon).toMatchObject({
        name: 'Pikachu',
        ability: 'static',
        hp: 50,
        maxHP: 80,
        types: ['electric'],
        movesUsed: ['tackle'],
        heldItem: 'light-ball',
        gender: 'female',
      });
      expect(pokemon.moves).toEqual([move]);
      expect(pokemon.moves[0]).not.toBe(move);
      expect(pokemon.statusEffects).toEqual({ burn: { turns: 2 } });
      expect(pokemon.statusEffects.burn).not.toBe(undefined);
      expect(pokemon.statStages.attack).toBe(2);
      expect(pokemon.statStages.speed).toBe(1);
    });

    it('mantém createDummy como alias caracterizado de compatibilidade', () => {
      const legacy = createDummy({ name: 'Legado' });

      expect(legacy.name).toBe('Legado');
      expect(legacy.moves).toEqual([]);
      expect(legacy).toEqual(createPokemon({ name: 'Legado' }));
    });

    it('independiza arrays, golpes, status e estágios mesmo com overrides compartilhados', () => {
      const sharedMove = createMove({ effect: { status: 'burn', chance: 10 } });
      const overrides: Partial<Pokemon> = {
        types: ['fire'],
        fallbackUrls: ['front.png'],
        moves: [sharedMove],
        movePool: [sharedMove],
        movesUsed: ['tackle'],
        possibleAbilities: ['blaze'],
        disabledMoves: { tackle: 2 },
        statusEffects: { burn: { turns: 2 } },
        statStages: {
          accuracy: 0,
          evasion: 0,
          attack: 1,
          defense: 0,
          spAttack: 0,
          spDefense: 0,
          speed: 0,
        },
        ivs: { hp: 31, attack: 31, defense: 31, spAttack: 31, spDefense: 31, speed: 31 },
      };

      const first = createPokemon(overrides);
      const second = createPokemon(overrides);

      expect(first).not.toBe(second);
      expect(first.types).not.toBe(second.types);
      expect(first.fallbackUrls).not.toBe(second.fallbackUrls);
      expect(first.moves).not.toBe(second.moves);
      expect(first.movePool).not.toBe(second.movePool);
      expect(first.movesUsed).not.toBe(second.movesUsed);
      expect(first.possibleAbilities).not.toBe(second.possibleAbilities);
      expect(first.disabledMoves).not.toBe(second.disabledMoves);
      expect(first.statusEffects).not.toBe(second.statusEffects);
      expect(first.statusEffects.burn).not.toBe(second.statusEffects.burn);
      expect(first.statStages).not.toBe(second.statStages);
      expect(first.ivs).not.toBe(second.ivs);
      expect(first.moves[0]).not.toBe(sharedMove);

      first.moves[0].effect!.chance = 90;
      first.types.push('flying');
      first.fallbackUrls.push('back.png');
      first.movesUsed.push('ember');
      first.possibleAbilities!.push('solar-power');
      first.disabledMoves!.tackle = 5;
      first.statusEffects.burn.turns = 0;
      first.statStages.attack = 6;
      first.ivs!.hp = 0;

      expect(second.moves[0].effect!.chance).toBe(10);
      expect(second.types).toEqual(['fire']);
      expect(second.fallbackUrls).toEqual(['front.png']);
      expect(second.movesUsed).toEqual(['tackle']);
      expect(second.possibleAbilities).toEqual(['blaze']);
      expect(second.disabledMoves!.tackle).toBe(2);
      expect(second.statusEffects.burn.turns).toBe(2);
      expect(second.statStages.attack).toBe(1);
      expect(second.ivs!.hp).toBe(31);
    });
  });

  describe('createSideHazards', () => {
    it('cria hazards com padrões válidos, determinísticos e campos completos', () => {
      expect(createSideHazards()).toEqual({
        toxicSpikes: 0,
        reflect: 0,
        lightScreen: 0,
        safeguard: 0,
        mist: 0,
        luckyChant: 0,
        auroraVeil: 0,
        stealthRock: false,
        stickyWeb: false,
        spikes: 0,
        tailwind: 0,
      });
      expect(createSideHazards()).toEqual(createSideHazards());
    });

    it('aplica overrides e independiza instâncias', () => {
      const first = createSideHazards({ stealthRock: true, spikes: 2, tailwind: 3 });
      const second = createSideHazards({ stealthRock: true, spikes: 2, tailwind: 3 });

      expect(first).toMatchObject({ stealthRock: true, spikes: 2, tailwind: 3, toxicSpikes: 0 });
      expect(first).not.toBe(second);

      first.spikes = 3;

      expect(second.spikes).toBe(2);
    });
  });

  describe('createPlayerInventory e createBagItem', () => {
    it('cria item e inventário com padrões válidos, determinísticos e vazios independentes', () => {
      expect(createBagItem()).toEqual({ id: 'potion', quantity: 1 });
      expect(createPlayerInventory()).toEqual({ items: [] });
      expect(createPlayerInventory()).toEqual(createPlayerInventory());

      const first = createPlayerInventory();
      const second = createPlayerInventory();

      expect(first.items).not.toBe(second.items);

      first.items.push(createBagItem());

      expect(second.items).toEqual([]);
    });

    it('aplica overrides e independiza itens compartilhados', () => {
      const sharedItems = [createBagItem({ id: 'revive', quantity: 2 })];
      const first = createPlayerInventory({ items: sharedItems });
      const second = createPlayerInventory({ items: sharedItems });

      expect(first.items).toEqual([{ id: 'revive', quantity: 2 }]);
      expect(first.items).not.toBe(second.items);
      expect(first.items[0]).not.toBe(second.items[0]);
      expect(first.items[0]).not.toBe(sharedItems[0]);

      first.items[0].quantity = 5;

      expect(second.items[0].quantity).toBe(2);
      expect(sharedItems[0].quantity).toBe(2);
    });
  });

  describe('createBattleState', () => {
    it('cria estado completo com padrões válidos e determinísticos', () => {
      const state = createBattleState();

      expect(state).toMatchObject({
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
        logs: [],
        isBattleInProgress: true,
        winner: null,
        waitingForAction: false,
      });
      expect(state.p1Inventory).toEqual({ items: [] });
      expect(state.p2Inventory).toEqual({ items: [] });
      expect(state.p1Hazards).toEqual(createSideHazards());
      expect(state.p2Hazards).toEqual(createSideHazards());
      expect(state.team1).toHaveLength(1);
      expect(state.team2).toHaveLength(1);
      expect(state.currentPokemon1).toBe(state.team1[0]);
      expect(state.currentPokemon2).toBe(state.team2[0]);
      expect(createBattleState()).toEqual(createBattleState());
    });

    it('preserva a identidade do ativo inicial e usa null em times vazios', () => {
      const p1 = createPokemon({ name: 'Ativo 1' });
      const p2 = createPokemon({ name: 'Ativo 2' });
      const state = createBattleState([p1], [p2]);

      expect(state.currentPokemon1).toBe(p1);
      expect(state.currentPokemon2).toBe(p2);
      expect(state.currentPokemon1).toBe(state.team1[0]);
      expect(state.currentPokemon2).toBe(state.team2[0]);

      const empty = createBattleState([], []);

      expect(empty.currentPokemon1).toBeNull();
      expect(empty.currentPokemon2).toBeNull();
    });

    it('aplica overrides de estado, times e ativo, mantendo a coerência do time', () => {
      const p1 = createPokemon({ name: 'Substituto 1' });
      const p2 = createPokemon({ name: 'Substituto 2' });
      const active = createPokemon({ name: 'Ativo explícito' });
      const state = createBattleState([], [], {
        team1: [p1],
        team2: [p2],
        currentPokemon1: active,
        turn: 7,
        weather: 'rain',
        gravity: true,
        p1Hazards: createSideHazards({ stealthRock: true, spikes: 2 }),
        p2Inventory: createPlayerInventory({ items: [createBagItem({ id: 'revive', quantity: 2 })] }),
      });

      expect(state.turn).toBe(7);
      expect(state.weather).toBe('rain');
      expect(state.gravity).toBe(true);
      expect(state.team1[0]).toBe(p1);
      expect(state.team2[0]).toBe(p2);
      expect(state.currentPokemon1).toBe(active);
      expect(state.p1Hazards).toMatchObject({ stealthRock: true, spikes: 2 });
      expect(state.p2Inventory.items).toEqual([{ id: 'revive', quantity: 2 }]);
    });

    it('independiza times, hazards, inventários e logs entre instâncias', () => {
      const p1 = createPokemon({ name: 'P1' });
      const p2 = createPokemon({ name: 'P2' });
      const sharedTeam = [p1];
      const sharedHazards = createSideHazards({ spikes: 2 });
      const sharedInventory = createPlayerInventory({ items: [createBagItem()] });
      const sharedLogs: LogEntry[] = [{ message: 'turno 1', color: 'text-white' }];
      const overrides: Partial<BattleState> = {
        team1: sharedTeam,
        team2: [p2],
        p1Hazards: sharedHazards,
        p2Hazards: sharedHazards,
        p1Inventory: sharedInventory,
        p2Inventory: sharedInventory,
        logs: sharedLogs,
      };

      const first = createBattleState([], [], overrides);
      const second = createBattleState([], [], overrides);

      expect(first).not.toBe(second);
      expect(first.team1).not.toBe(second.team1);
      expect(first.team2).not.toBe(second.team2);
      expect(first.p1Hazards).not.toBe(second.p1Hazards);
      expect(first.p1Hazards).not.toBe(sharedHazards);
      expect(first.p1Inventory).not.toBe(second.p1Inventory);
      expect(first.p1Inventory.items).not.toBe(second.p1Inventory.items);
      expect(first.p1Inventory.items[0]).not.toBe(sharedInventory.items[0]);
      expect(first.logs).not.toBe(second.logs);
      expect(first.logs[0]).not.toBe(sharedLogs[0]);
      expect(first.currentPokemon1).toBe(first.team1[0]);

      first.team1.push(createPokemon({ name: 'Reserva' }));
      first.p1Hazards.spikes = 3;
      first.p1Inventory.items[0].quantity = 5;
      first.logs.push({ message: 'turno 2', color: 'text-white' });

      expect(second.team1).toHaveLength(1);
      expect(second.p1Hazards.spikes).toBe(2);
      expect(second.p1Inventory.items[0].quantity).toBe(1);
      expect(second.logs).toHaveLength(1);
    });
  });

  describe('garantias transversais das fixtures', () => {
    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
    });

    it('constrói todas as fixtures sem rede, Math.random ou IndexedDB', () => {
      const fetchMock = vi.fn(() => {
        throw new Error('rede proibida durante a construção de fixtures');
      });
      const indexedDBOpen = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      vi.stubGlobal('indexedDB', { open: indexedDBOpen });
      const randomMock = vi.spyOn(Math, 'random').mockImplementation(() => {
        throw new Error('Math.random proibido durante a construção de fixtures');
      });

      const fixtures = [
        createMove(),
        createPokemon(),
        createSideHazards(),
        createBagItem(),
        createPlayerInventory(),
        createBattleState(),
      ];

      expect(fixtures).toHaveLength(6);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(indexedDBOpen).not.toHaveBeenCalled();
      expect(randomMock).not.toHaveBeenCalled();
    });

    it('repete a construção com resultados determinísticos', () => {
      const build = () => [
        createMove(),
        createPokemon(),
        createSideHazards(),
        createBagItem(),
        createPlayerInventory(),
        createBattleState(),
      ];

      expect(build()).toEqual(build());
    });
  });
});

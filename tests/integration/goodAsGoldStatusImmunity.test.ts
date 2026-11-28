import { describe, expect, it } from 'vitest';
import type { Move, Pokemon } from '../../types';
import {
  createBagItem,
  createBattleState,
  createMove,
  createPlayerInventory,
  createPokemon,
} from '../factories';
import {
  createBattleConfig,
  createItemAction,
  createMoveAction,
  runCoordinatorTurn,
} from './coordinator.helpers';

// 4.1.3 — Vale Ouro (Good as Gold) conectado ao caminho público de golpes de status.
// Regra oficial: o portador é imune a golpes de STATUS usados por outros Pokémon que tenham
// ele como alvo. Movimentos que atingem o campo ou o próprio lado (hazards, telas, Tailwind),
// efeitos próprios, golpes de dano e itens continuam funcionando normalmente.

const CONFIG = createBattleConfig({
  forceAccuracyOutcome: 'hit',
  fixedRoll: 92.5,
  itemsEnabled: true,
  moveLimitEnabled: false,
});

const SEED = 4131;

const STAGES = {
  accuracy: 0,
  evasion: 0,
  attack: 0,
  defense: 0,
  spAttack: 0,
  spDefense: 0,
  speed: 0,
};

const createAttacker = (overrides: Partial<Pokemon> = {}): Pokemon =>
  createPokemon({
    id: 501,
    name: 'Atacante 4.1.3',
    ability: 'synchronize',
    types: ['normal'],
    hp: 300,
    maxHP: 300,
    attackStat: 120,
    spAttackStat: 120,
    defenseStat: 100,
    spDefenseStat: 100,
    speedStat: 120,
    moves: [],
    statStages: { ...STAGES },
    ...overrides,
  });

// O tipo é neutro de propósito: isolar a habilidade, sem imunidade de tipo (Aço x Veneno).
const createGolden = (overrides: Partial<Pokemon> = {}): Pokemon =>
  createPokemon({
    id: 502,
    name: 'Gholdengo',
    ability: 'good-as-gold',
    types: ['normal'],
    hp: 300,
    maxHP: 300,
    attackStat: 100,
    spAttackStat: 100,
    defenseStat: 100,
    spDefenseStat: 100,
    speedStat: 80,
    moves: [],
    statStages: { ...STAGES },
    ...overrides,
  });

const statusMove = (
  name: string,
  displayName: string,
  type: string,
  effectStatus?: string,
): Move =>
  createMove({
    name,
    displayName,
    type,
    power: 0,
    accuracy: 100,
    isStatus: true,
    damageClass: 'status',
    uses: 20,
    maxUses: 20,
    ...(effectStatus ? { effect: { status: effectStatus, chance: 100 } } : {}),
  });

const fieldMove = (name: string, displayName: string, type: string): Move =>
  createMove({
    name,
    displayName,
    type,
    power: 0,
    accuracy: 100,
    isStatus: true,
    damageClass: 'status',
    uses: 20,
    maxUses: 20,
  });

const damageMove = (): Move =>
  createMove({
    name: 'tackle',
    displayName: 'Investida',
    type: 'normal',
    power: 60,
    accuracy: 100,
    damageClass: 'physical',
    uses: 20,
    maxUses: 20,
  });

const tackle = damageMove();

interface RunOptions {
  p1?: Pokemon;
  p2?: Pokemon;
  p1Action?: (state: ReturnType<typeof createBattleState>) => Parameters<typeof runCoordinatorTurn>[0]['p1Action'];
  p2Action?: (state: ReturnType<typeof createBattleState>) => Parameters<typeof runCoordinatorTurn>[0]['p2Action'];
  inventory?: boolean;
}

const runTurn = ({ p1 = createAttacker(), p2 = createGolden(), p1Action, p2Action, inventory }: RunOptions) => {
  const state = createBattleState([p1], [p2], {
    ...(inventory
      ? { p2Inventory: createPlayerInventory({ items: [createBagItem({ id: 'potion', quantity: 1 })] }) }
      : {}),
  });
  const turn = runCoordinatorTurn({
    seed: SEED,
    initialState: state,
    p1Action: p1Action?.(state),
    p2Action: p2Action?.(state),
    config: CONFIG,
  });
  return {
    state,
    turn,
    messages: turn.steps.flatMap(step => step.logs.map(entry => entry.message)),
  };
};

const immuneMessage = 'Gholdengo é imune a golpes de status devido ao seu corpo dourado!';

describe('4.1.3 Vale Ouro (Good as Gold)', () => {
  it('bloqueia Tóxico do oponente pelo caminho público e registra a imunidade', () => {
    const toxic = statusMove('toxic', 'Tóxico', 'poison', 'poison');

    const control = runTurn({
      p2: createGolden({ ability: 'synchronize' }),
      p1Action: state => createMoveAction(state.currentPokemon1!, toxic, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, tackle, 2),
    });
    expect(control.turn.finalState.currentPokemon2!.statusEffects.poison).toBeDefined();

    const guarded = runTurn({
      p1Action: state => createMoveAction(state.currentPokemon1!, toxic, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, tackle, 2),
    });
    expect(guarded.turn.finalState.currentPokemon2!.statusEffects.poison).toBeUndefined();
    expect(guarded.messages).toContain(immuneMessage);
    // O golpe de dano do adversário continua funcionando no mesmo turno.
    expect(guarded.turn.finalState.currentPokemon1!.hp).toBeLessThan(300);
  });

  it('bloqueia Provocar do oponente e não aplica o efeito volátil', () => {
    const taunt = fieldMove('taunt', 'Provocar', 'dark');

    const control = runTurn({
      p2: createGolden({ ability: 'synchronize' }),
      p1Action: state => createMoveAction(state.currentPokemon1!, taunt, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, tackle, 2),
    });
    expect(control.turn.finalState.currentPokemon2!.statusEffects.taunt).toBeDefined();

    const guarded = runTurn({
      p1Action: state => createMoveAction(state.currentPokemon1!, taunt, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, tackle, 2),
    });
    expect(guarded.turn.finalState.currentPokemon2!.statusEffects.taunt).toBeUndefined();
    expect(guarded.messages).toContain(immuneMessage);
  });

  it('aceita golpes de dano do oponente nos dois sentidos', () => {
    const result = runTurn({
      p1Action: state => createMoveAction(state.currentPokemon1!, tackle, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, tackle, 2),
    });

    expect(result.turn.finalState.currentPokemon2!.hp).toBeLessThan(300);
    expect(result.turn.finalState.currentPokemon1!.hp).toBeLessThan(300);
    expect(result.messages).not.toContain(immuneMessage);
  });

  it('aceita efeitos próprios do portador e do oponente', () => {
    const swordsDance = statusMove('swords-dance', 'Dança das Espadas', 'normal', 'attack-up');

    const result = runTurn({
      p1Action: state => createMoveAction(state.currentPokemon1!, tackle, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, swordsDance, 2),
    });

    expect(result.turn.finalState.currentPokemon2!.statStages.attack).toBe(2);
    expect(result.turn.finalState.currentPokemon2!.hp).toBeLessThan(300);
  });

  it('aceita efeitos de itens que não são golpes de status', () => {
    const swordsDance = statusMove('swords-dance', 'Dança das Espadas', 'normal', 'attack-up');
    const golden = createGolden({ hp: 100, maxHP: 300 });

    const result = runTurn({
      p2: golden,
      p1Action: state => createMoveAction(state.currentPokemon1!, swordsDance, 1),
      p2Action: state => createItemAction(state.currentPokemon2!, golden.id, 'potion', 2),
      inventory: true,
    });

    expect(result.turn.finalState.currentPokemon2!.hp).toBeGreaterThan(100);
    expect(result.turn.finalState.currentPokemon1!.statStages.attack).toBe(2);
  });

  it('não bloqueia movimentos de campo e de lado do campo', () => {
    const stealthRock = fieldMove('stealth-rock', 'Pedras Flutuantes', 'rock');
    const spikes = fieldMove('spikes', 'Espinhos', 'ground');
    const reflect = fieldMove('reflect', 'Refletir', 'psychic');
    const tailwind = fieldMove('tailwind', 'Vento de Cauda', 'flying');

    const hazard = runTurn({
      p1Action: state => createMoveAction(state.currentPokemon1!, stealthRock, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, tackle, 2),
    });
    expect(hazard.turn.finalState.p2Hazards.stealthRock).toBe(true);
    expect(hazard.messages).not.toContain(immuneMessage);

    const layer = runTurn({
      p1Action: state => createMoveAction(state.currentPokemon1!, spikes, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, tackle, 2),
    });
    expect(layer.turn.finalState.p2Hazards.spikes).toBe(1);

    const screen = runTurn({
      p1Action: state => createMoveAction(state.currentPokemon1!, reflect, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, tackle, 2),
    });
    expect(screen.turn.finalState.p1Hazards.reflect).toBeGreaterThan(0);
    expect(screen.turn.finalState.p1Hazards.reflect).toBeLessThanOrEqual(5);

    const wind = runTurn({
      p1Action: state => createMoveAction(state.currentPokemon1!, tailwind, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, tackle, 2),
    });
    expect(wind.turn.finalState.p1Hazards.tailwind).toBeGreaterThan(0);
  });

  it('Mold Breaker não contorna a imunidade', () => {
    const toxic = statusMove('toxic', 'Tóxico', 'poison', 'poison');

    const result = runTurn({
      p1: createAttacker({ ability: 'mold-breaker' }),
      p1Action: state => createMoveAction(state.currentPokemon1!, toxic, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, tackle, 2),
    });

    expect(result.turn.finalState.currentPokemon2!.statusEffects.poison).toBeUndefined();
    expect(result.messages).toContain(immuneMessage);
  });

  it('Gás Neutralizante suprime a imunidade', () => {
    const toxic = statusMove('toxic', 'Tóxico', 'poison', 'poison');

    const result = runTurn({
      p1: createAttacker({ ability: 'neutralizing-gas' }),
      p1Action: state => createMoveAction(state.currentPokemon1!, toxic, 1),
      p2Action: state => createMoveAction(state.currentPokemon2!, tackle, 2),
    });

    expect(result.turn.finalState.currentPokemon2!.statusEffects.poison).toBeDefined();
    expect(result.messages).not.toContain(immuneMessage);
  });

  it('não altera o estado real recebido nem os logs de entrada', () => {
    const toxic = statusMove('toxic', 'Tóxico', 'poison', 'poison');
    const p1 = createAttacker();
    const p2 = createGolden();
    const state = createBattleState([p1], [p2]);
    const snapshot = structuredClone(state);

    runCoordinatorTurn({
      seed: SEED,
      initialState: state,
      p1Action: createMoveAction(state.currentPokemon1!, toxic, 1),
      p2Action: createMoveAction(state.currentPokemon2!, tackle, 2),
      config: CONFIG,
    });

    expect(state).toEqual(snapshot);
  });
});
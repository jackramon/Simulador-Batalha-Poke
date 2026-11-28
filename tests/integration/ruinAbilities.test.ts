import { describe, expect, it } from 'vitest';
import type { Move, Pokemon } from '../../types';
import { calculateStat } from '../../services/engine/handlers/statCalculator';
import * as BeadsOfRuin from '../../services/engine/handlers/abilities/beads_of_ruin';
import * as SwordOfRuin from '../../services/engine/handlers/abilities/sword_of_ruin';
import * as TabletsOfRuin from '../../services/engine/handlers/abilities/tablets_of_ruin';
import * as VesselOfRuin from '../../services/engine/handlers/abilities/vessel_of_ruin';
import { createBattleState, createMove, createPokemon } from '../factories';
import { createBattleConfig, createMoveAction, runCoordinatorTurn } from './coordinator.helpers';

// 4.1.3 — As quatro habilidades da Ruína passam a ser a única fonte da regra: cada uma reduz
// em 25% (0.75) o atributo correspondente dos OUTROS Pokémon em campo, nunca do portador,
// uma única vez por atributo (sem acúmulo por cópias) e respeitando supressão por
// Gás Neutralizante. As versões antigas dos handlers (multiplicador de dano) não tinham
// importadores e foram substituídas pela regra de atributo, que é a oficial.

const CONFIG = createBattleConfig({
  forceAccuracyOutcome: 'hit',
  fixedRoll: 92.5,
  itemsEnabled: false,
  moveLimitEnabled: false,
});

const SEED = 4132;
const FULL_HP = 400;

const STAGES = {
  accuracy: 0,
  evasion: 0,
  attack: 0,
  defense: 0,
  spAttack: 0,
  spDefense: 0,
  speed: 0,
};

type StatKey = 'attack' | 'defense' | 'spAttack' | 'spDefense';

const physicalMove = (): Move =>
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

const specialMove = (): Move =>
  createMove({
    name: 'swift',
    displayName: 'Ataque Rápido',
    type: 'normal',
    power: 60,
    accuracy: 100,
    damageClass: 'special',
    uses: 20,
    maxUses: 20,
  });

const createFighter = (id: number, name: string, ability: string, speedStat: number, overrides: Partial<Pokemon> = {}): Pokemon =>
  createPokemon({
    id,
    name,
    ability,
    types: ['normal'],
    hp: FULL_HP,
    maxHP: FULL_HP,
    attackStat: 120,
    spAttackStat: 120,
    defenseStat: 100,
    spDefenseStat: 100,
    speedStat,
    moves: [],
    statStages: { ...STAGES },
    ...overrides,
  });

const runDamageTurn = (p1Ability: string, p2Ability: string, moveClass: 'physical' | 'special') => {
  const buildMove = moveClass === 'physical' ? physicalMove : specialMove;
  const p1 = createFighter(601, 'P1 Ruína', p1Ability, 120);
  const p2 = createFighter(602, 'P2 Ruína', p2Ability, 80);
  const state = createBattleState([p1], [p2]);
  const snapshot = structuredClone(state);

  const turn = runCoordinatorTurn({
    seed: SEED,
    initialState: state,
    p1Action: createMoveAction(state.currentPokemon1!, buildMove(), 1),
    p2Action: createMoveAction(state.currentPokemon2!, buildMove(), 2),
    config: CONFIG,
  });

  return {
    p1Damage: FULL_HP - turn.finalState.currentPokemon2!.hp,
    p2Damage: FULL_HP - turn.finalState.currentPokemon1!.hp,
    randomDraws: turn.randomDraws,
    finalState: turn.finalState,
    inputState: state,
    inputSnapshot: snapshot,
  };
};

interface RuinCase {
  ability: string;
  label: string;
  stat: StatKey;
  moveClass: 'physical' | 'special';
  // 'defender': reduz a defesa do alvo, então o dano do portador aumenta.
  // 'attacker': reduz o ataque do oponente, então o dano recebido diminui.
  affects: 'defender' | 'attacker';
  module: { getStatMultiplier: (stat: StatKey, targetAbility: string | undefined, opponentAbility: string | undefined) => number };
}

const RUIN_CASES: RuinCase[] = [
  {
    ability: 'beads-of-ruin',
    label: 'Contas da Ruína',
    stat: 'spDefense',
    moveClass: 'special',
    affects: 'defender',
    module: BeadsOfRuin,
  },
  {
    ability: 'sword-of-ruin',
    label: 'Espada da Ruína',
    stat: 'defense',
    moveClass: 'physical',
    affects: 'defender',
    module: SwordOfRuin,
  },
  {
    ability: 'tablets-of-ruin',
    label: 'Tabuletas da Ruína',
    stat: 'attack',
    moveClass: 'physical',
    affects: 'attacker',
    module: TabletsOfRuin,
  },
  {
    ability: 'vessel-of-ruin',
    label: 'Vaso da Ruína',
    stat: 'spAttack',
    moveClass: 'special',
    affects: 'attacker',
    module: VesselOfRuin,
  },
];

const targetStat = (pokemon: Pokemon, stat: StatKey, opponentAbility?: string) =>
  calculateStat(pokemon, stat, 'none', false, false, 'none', false, false, opponentAbility);

describe.each(RUIN_CASES)('4.1.3 $label ($ability)', ({ ability, stat, moveClass, affects, module }) => {
  it('aplica 0.75 ao atributo correto do oponente e preserva o portador', () => {
    const target = createFighter(701, 'Alvo', 'synchronize', 100);
    const holder = createFighter(702, 'Portador', ability, 100);
    const base = targetStat(target, stat);

    // Prova de wiring: o valor calculado é exatamente o multiplicador exportado pelo handler.
    expect(module.getStatMultiplier(stat, target.ability, ability)).toBe(0.75);
    expect(targetStat(target, stat, ability)).toBe(Math.floor(base * module.getStatMultiplier(stat, target.ability, ability)));
    expect(targetStat(target, stat, ability)).toBe(Math.floor(base * 0.75));

    // O portador nunca sofre a própria redução.
    expect(targetStat(holder, stat, ability)).toBe(base);
    // Nenhum outro atributo é tocado.
    const otherStat: StatKey = stat === 'defense' ? 'spDefense' : 'defense';
    expect(targetStat(target, otherStat, ability)).toBe(targetStat(target, otherStat));
  });

  it('não acumula quando as duas cópias da habilidade estão em campo', () => {
    const mirrored = createFighter(703, 'Alvo Espelho', ability, 100);
    const base = targetStat(mirrored, stat);

    // Cópias da mesma habilidade concedem imunidade recíproca: nenhuma redução.
    expect(targetStat(mirrored, stat, ability)).toBe(base);

    // Com uma única cópia em campo a redução é exatamente 25%, nunca 43,75%.
    const single = createFighter(705, 'Alvo Único', 'synchronize', 100);
    expect(targetStat(single, stat, ability)).toBe(Math.floor(base * 0.75));
    expect(targetStat(single, stat, ability)).not.toBe(Math.floor(base * 0.5625));
  });

  it('mantém a supressão por Gás Neutralizante', () => {
    const target = createFighter(704, 'Alvo Suprimido', 'synchronize', 100);
    const base = targetStat(target, stat);

    expect(calculateStat(target, stat, 'none', true, false, 'none', false, false, ability)).toBe(base);
  });

  it('alcança o cálculo de dano pelo coordenador sem consumir PRNG', () => {
    const baseline = runDamageTurn('synchronize', 'synchronize', moveClass);
    const withRuin = runDamageTurn(ability, 'synchronize', moveClass);

    expect(baseline.p1Damage).toBeGreaterThan(0);
    expect(baseline.p2Damage).toBeGreaterThan(0);
    // A habilidade não adiciona sorteios: o cursor final é o mesmo do cenário sem habilidade.
    expect(withRuin.randomDraws).toBe(baseline.randomDraws);

    if (affects === 'defender') {
      // Defesa do alvo reduzida: o dano do portador sobe ~4/3 e o dano recebido não muda.
      expect(withRuin.p1Damage).toBeGreaterThan(baseline.p1Damage * 1.25);
      expect(withRuin.p1Damage).toBeLessThan(baseline.p1Damage * 1.45);
      expect(withRuin.p2Damage).toBe(baseline.p2Damage);
    } else {
      // Ataque do oponente reduzido: o dano recebido cai ~25% e o dano causado não muda.
      expect(withRuin.p2Damage).toBeLessThan(baseline.p2Damage * 0.85);
      expect(withRuin.p2Damage).toBeGreaterThan(baseline.p2Damage * 0.65);
      expect(withRuin.p1Damage).toBe(baseline.p1Damage);
    }

    // Estado real e cursor permanecem imutáveis.
    expect(withRuin.inputState).toEqual(withRuin.inputSnapshot);
    expect(withRuin.inputState.prngState).toBeUndefined();
  });
});